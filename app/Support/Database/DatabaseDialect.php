<?php

namespace App\Support\Database;

use Closure;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class DatabaseDialect
{
    public static function isPostgreSql(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }

    public static function isMySqlFamily(): bool
    {
        return in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true);
    }

    /**
     * Run work in a transaction while serializing callers that share a logical key.
     * PostgreSQL locks are transaction-scoped; MySQL/MariaDB named locks are
     * explicitly released after commit or rollback.
     */
    public static function withTransactionLock(string $key, Closure $callback): mixed
    {
        if (self::isPostgreSql()) {
            return DB::transaction(function () use ($key, $callback): mixed {
                DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [$key]);

                return $callback();
            });
        }

        if (! self::isMySqlFamily()) {
            throw new RuntimeException('Unsupported database driver for advisory transaction locks.');
        }

        $lockName = 'ordersync:'.substr(hash('sha256', $key), 0, 54);
        $result = DB::selectOne('SELECT GET_LOCK(?, 10) AS acquired', [$lockName]);
        if ((int) ($result->acquired ?? 0) !== 1) {
            throw new RuntimeException('The operation is busy. Try again.');
        }

        try {
            return DB::transaction($callback);
        } finally {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS released', [$lockName]);
        }
    }

    public static function dropCheckConstraint(string $table, string $constraint, bool $ifExists = false): void
    {
        self::assertIdentifier($table);
        self::assertIdentifier($constraint);

        if (self::isPostgreSql()) {
            DB::statement(sprintf(
                'ALTER TABLE "%s" DROP CONSTRAINT %s"%s"',
                $table,
                $ifExists ? 'IF EXISTS ' : '',
                $constraint,
            ));

            return;
        }

        if (! self::isMySqlFamily()) {
            throw new RuntimeException('Unsupported database driver for dropping check constraints.');
        }

        if ($ifExists && ! self::constraintExists($table, $constraint)) {
            return;
        }

        $operation = self::isMariaDbServer() ? 'DROP CONSTRAINT' : 'DROP CHECK';
        DB::statement(sprintf('ALTER TABLE `%s` %s `%s`', $table, $operation, $constraint));
    }

    private static function constraintExists(string $table, string $constraint): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::connection()->getDatabaseName())
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->exists();
    }

    private static function isMariaDbServer(): bool
    {
        $version = DB::selectOne('SELECT VERSION() AS version');

        return str_contains(strtolower((string) ($version->version ?? '')), 'mariadb');
    }

    private static function assertIdentifier(string $identifier): void
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $identifier)) {
            throw new \InvalidArgumentException('Unsafe database identifier.');
        }
    }
}
