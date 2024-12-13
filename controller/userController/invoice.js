const { render } = require('ejs');
const Order = require('../../model/orderSchema.js');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.downloadPDF = async (req, res) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).send('Order ID is required');
        }

        const order = await Order.findById(orderId)
            .populate('userId', 'name email')
            .populate('items.productId', 'name price discount category');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-report-${orderId}.pdf`);
        doc.pipe(res);

       
        doc.fontSize(20).font('Helvetica-Bold').text('Order Report', { align: 'center' });
        doc.moveDown(1);

      
        doc.fontSize(12).font('Helvetica').text(`Order ID: ${order._id}`);
        doc.text(`Customer: ${order.userId.name}`);
        doc.text(`Email: ${order.userId.email}`);
        doc.text(`Total Amount: $${order.totalAmount}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        
        doc.text(`Order Coupon Offer: ${order.discount || 0}`);
        doc.moveDown(1);

      
        const headers = ['Product Name', 'Price', 'Quantity', 'Final Price'];
        const columnWidths = [200, 80, 80, 100];

        headers.forEach((header, i) => {
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, {
                    width: columnWidths[i],
                    align: 'center',
                });
        });

        doc.moveDown(0.5);
        doc.strokeColor('#000').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

      
        if (!order.items || order.items.length === 0) {
            doc.text('No products found in this order.', 50, doc.y, { align: 'left' });
        } else {
            order.items.forEach((item) => {
                const productName = item.productId?.name || 'N/A';
                const productPrice = item.productPrice || 0;
                const quantity = item.productCount || 0;
                const productDiscount = item.productDiscount || 0;
                const finalPrice = productPrice*quantity - productDiscount;

                doc.font('Helvetica').fontSize(9)
                    .text(productName, 50, doc.y, { width: columnWidths[0], align: 'left' })
                    .text(`$${productPrice.toFixed(2)}`, 50 + columnWidths[0], doc.y, { width: columnWidths[1], align: 'center' })
                    .text(quantity.toString(), 50 + columnWidths[0] + columnWidths[1], doc.y, { width: columnWidths[2], align: 'center' })
                    .text(`$${finalPrice.toFixed(2)}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], doc.y, { width: columnWidths[3], align: 'center' });

                doc.moveDown(1);
            });
        }

        doc.end();

    } catch (error) {
      
        res.status(500).send('Error generating PDF report');
    }
};
