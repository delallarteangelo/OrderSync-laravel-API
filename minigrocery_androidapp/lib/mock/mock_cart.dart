import 'mock_products.dart';
import 'models.dart';

final List<CartLine> mockCart = [
  CartLine(product: mockProducts[0], quantity: 2),
  CartLine(product: mockProducts[6], quantity: 3),
  CartLine(product: mockProducts[8], quantity: 1),
];

double get mockCartSubtotal =>
    mockCart.fold<double>(0, (sum, l) => sum + l.subtotal);
const double mockDeliveryFee = 49.0;
double get mockCartTotal => mockCartSubtotal + mockDeliveryFee;
