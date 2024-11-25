const { render } = require('ejs');
const Order = require('../../model/orderSchema.js');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.GetsalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType } = req.query;

        let dateFilter = {};
        const currentDate = new Date();

        switch (reportType) {
            case 'daily':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
                    },
                };
                break;

                case 'weekly':
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
                    startOfWeek.setHours(0, 0, 0, 0); 
                
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6); 
                    endOfWeek.setHours(23, 59, 59, 999);
                
                    dateFilter = {
                        createdAt: {
                            $gte: startOfWeek, 
                            $lt: endOfWeek,    
                        },
                    };
                    break;
                
            case 'monthly':
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                dateFilter = {
                    createdAt: {
                        $gte: new Date(monthStart),
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
                    },
                };
                break;

            case 'yearly':
                const yearStart = new Date(currentDate.getFullYear(), 0, 1); 
                const yearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999); 
                dateFilter = {
                    createdAt: {
                        $gte: new Date(yearStart),
                        $lt: new Date(yearEnd),
                    },
                };
                break;

            case 'custom':
                if (startDate && endDate) {
                    dateFilter = {
                        createdAt: {
                            $gte: new Date(startDate),
                            $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                        },
                    };
                }
                break;

            default:
                break;
        }

        
        const orders = await Order.find(dateFilter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

      
        const summary = orders.reduce(
            (acc, order) => {
                acc.totalOrders++;
                acc.totalAmount += order.totalAmount || 0;
                acc.totalDiscount += order.discount || 0;
                return acc;
            },
            { totalOrders: 0, totalAmount: 0, totalDiscount: 0 }
        );


        res.render('admin/salesReport', {
            orders,
            summary,
            filters: { startDate, endDate, reportType },
        });
    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).send('Error generating sales report');
    }
};




exports.downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

    
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }).populate('userId', 'name email');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

     
        worksheet.columns = [
            { header: 'Order ID', key: '_id', width: 20 },
            { header: 'Customer Name', key: 'customer', width: 25 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Items', key: 'items', width: 10 },
            { header: 'Total Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

      
        orders.forEach(order => {
            order.items.forEach(item => {
                worksheet.addRow({
                    _id: order._id.toString(),
                    customer: order.userId?.name || 'N/A',
                    date: order.createdAt.toLocaleDateString(),
                    items: order.items.length,
                    amount: order.totalAmount.toFixed(2),
                    discount: (order.discount || 0).toFixed(2),
                    finalAmount: (order.totalAmount - (order.discount || 0)).toFixed(2),
                    paymentMethod: order.paymentMethod || 'N/A',
                    status: item.productStatus || 'N/A', 
                });
            });
        });

      
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-${endDate}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel download error:', error);
        res.status(500).send('Error downloading Excel report');
    }
};



exports.downloadPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

       
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
        }).populate('userId', 'name email');

       
        const doc = new PDFDocument({ margin: 30 });

        doc.font('Helvetica-Bold').fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(2);

        doc.font('Helvetica-Bold').fontSize(12).text('Order ID', 50, doc.y);
        doc.text('Customer', 150, doc.y);
        doc.text('Date', 250, doc.y);
        doc.text('Items', 350, doc.y);
        doc.text('Total Amount', 450, doc.y);
        doc.text('Discount', 550, doc.y);
        doc.text('Final Amount', 650, doc.y);
        doc.text('Payment Method', 750, doc.y);
        doc.text('Status', 850, doc.y);
        doc.moveDown(1); 

        
        orders.forEach(order => {
            order.items.forEach(item => {
                doc.font('Helvetica').fontSize(10);
                doc.text(order._id.toString(), 50, doc.y);
                doc.text(order.userId?.name || 'N/A', 150, doc.y);
                doc.text(order.createdAt.toLocaleDateString(), 250, doc.y);
                doc.text(order.items.length.toString(), 350, doc.y);
                doc.text(order.totalAmount.toFixed(2), 450, doc.y);
                doc.text((order.discount || 0).toFixed(2), 550, doc.y);
                doc.text((order.totalAmount - (order.discount || 0)).toFixed(2), 650, doc.y);
                doc.text(order.paymentMethod || 'N/A', 750, doc.y);
                doc.text(item.productStatus || 'N/A', 850, doc.y);
                doc.moveDown(0.5); 
            });
        });

       
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-${endDate}.pdf`);

        doc.pipe(res);

        doc.end();

    } catch (error) {
        console.error('PDF download error:', error);
        res.status(500).send('Error generating PDF report');
    }
};