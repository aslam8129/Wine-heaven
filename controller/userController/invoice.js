const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const Order = require('../../model/orderSchema.js');

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

        // Render HTML using EJS
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '../../views/user/orderReport.ejs'),
            { order }
        );

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        });

        await browser.close();

        // Send PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-report-${orderId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF report');
    }
};
