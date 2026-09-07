import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatPHP } from "@/shared/lib/money";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#64748b" },
  table: { display: "flex", flexDirection: "column", width: "100%" },
  trh: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#0f172a",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#e2e8f0",
    paddingVertical: 4,
  },
  td: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  tdRight: { flexGrow: 1, flexBasis: 0, paddingRight: 8, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#64748b",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export type PdfColumn = {
  header: string;
  key: string;
  align?: "left" | "right";
  format?: "currency" | "number" | "text";
};

export type PdfReportProps = {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: Array<{ label: string; value: string }>;
};

function ReportDoc({ title, subtitle, columns, rows, totals }: PdfReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View>
            <Text style={styles.subtitle}>Tonette's Minimart</Text>
            <Text style={styles.subtitle}>Generated {new Date().toLocaleString("en-PH")}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.trh}>
            {columns.map((c) => (
              <Text key={c.key} style={c.align === "right" ? styles.tdRight : styles.td}>
                {c.header}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.tr}>
              {columns.map((c) => {
                const raw = row[c.key];
                let display: string;
                if (c.format === "currency") display = formatPHP(Number(raw ?? 0));
                else if (c.format === "number") display = String(Number(raw ?? 0));
                else display = String(raw ?? "");
                return (
                  <Text key={c.key} style={c.align === "right" ? styles.tdRight : styles.td}>
                    {display}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>

        {totals && totals.length > 0 ? (
          <View style={{ marginTop: 12, alignItems: "flex-end" }}>
            {totals.map((t) => (
              <Text key={t.label} style={{ marginTop: 2 }}>
                {t.label}: {t.value}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Tonette's Minimart — confidential</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadReportPdf(filename: string, props: PdfReportProps): Promise<void> {
  const blob = await pdf(<ReportDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
