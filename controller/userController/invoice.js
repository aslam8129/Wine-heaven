const Order = require('../../model/orderSchema');
const puppeteer = require('puppeteer');
const path = require('path');

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

        // Generate HTML content for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    h1, h2 {
                        text-align: center;
                        color: #333;
                    }
                    .order-details, .product-table {
                        margin-top: 20px;
                        width: 100%;
                    }
                    .order-details p {
                        margin: 5px 0;
                    }
                    .product-table table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    .product-table th, .product-table td {
                        border: 1px solid #ccc;
                        padding: 10px;
                        text-align: left;
                    }
                    .product-table th {
                        background-color: #f4f4f4;
                    }
                </style>
            </head>
            <body>
                <h1>Order Report</h1>
                <div class="order-details">
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Customer:</strong> ${order.userId.name}</p>
                    <p><strong>Email:</strong> ${order.userId.email}</p>
                    <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Discount:</strong> $${order.discount || 0}</p>
                </div>
                <div class="product-table">
                    <h2>Order Items</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Final Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                order.items.map(item => `
                                    <tr>
                                        <td>${item.productId?.name || 'N/A'}</td>
                                        <td>$${item.productPrice.toFixed(2)}</td>
                                        <td>${item.productCount}</td>
                                        <td>$${(item.productPrice * item.productCount - (item.productDiscount || 0)).toFixed(2)}</td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });
        await browser.close();

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-report-${orderId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
};
