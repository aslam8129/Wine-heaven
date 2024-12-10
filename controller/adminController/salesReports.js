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
                const today = new Date(currentDate);
                const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
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
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

                dateFilter = {
                    createdAt: {
                        $gte: monthStart,
                        $lt: monthEnd,
                    },
                };
                break;

            case 'yearly':
                const yearStart = new Date(currentDate.getFullYear(), 0, 1);
                const yearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

                dateFilter = {
                    createdAt: {
                        $gte: yearStart,
                        $lt: yearEnd,
                    },
                };
                break;

            case 'custom':
                if (startDate && endDate && !isNaN(new Date(startDate)) && !isNaN(new Date(endDate))) {
                    dateFilter = {
                        createdAt: {
                            $gte: new Date(startDate),
                            $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                        },
                    };
                } else {
                    return res.status(400).send('Invalid custom date range');
                }
                break;

            default:
                break;
        }

        const orders = await Order.find(dateFilter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
           

      
      

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
        const { startDate, endDate, reportType } = req.query;

     

        let start, end;

        if (reportType === 'daily') {
            start = new Date(startDate);
            end = new Date(new Date(startDate).setHours(23, 59, 59, 999));  
        } else if (reportType === 'monthly') {
            start = new Date(startDate);
            start.setDate(1);  
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);  
            end.setHours(23, 59, 59, 999);  
        } else if (reportType === 'weekly') {
            start = new Date(startDate);
            let dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);  
            end = new Date(start);
            end.setDate(end.getDate() + 6);  
            end.setHours(23, 59, 59, 999);  
        } else {
            
            start = new Date(startDate);
            end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

       
       

       
        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lt: end
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
    
        res.status(500).send('Error downloading Excel report');
    }
};



exports.downloadPDF = async (req, res) => {
    try {
        const { startDate, endDate,reportType } = req.query;
       
        

        if (!startDate || !endDate) {
            return res.status(400).send('Start and end dates are required');
        }

       
        const start = new Date(startDate);
        const end = new Date(endDate);
        
    
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).send('Invalid date format');
        }

      
        end.setHours(23, 59, 59, 999);

        
        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lt: end
            }
        }).populate('userId', 'name email');


        const doc = new PDFDocument({ margin: 50 });

   
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-${endDate}.pdf`);

       
        doc.pipe(res);

    
        doc.fontSize(20).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
        doc.moveDown(1);


        doc.fontSize(12).font('Helvetica').text(`Report Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

       
        const headers = [
            'Order ID', 'Customer', 'Date', 
            'Items', 'Total Amount', 'Discount', 
            'Final Amount', 'Payment Method', 'Status'
        ];
        const columnWidths = [80, 100, 80, 40, 80, 80, 80, 100, 80];

   
        headers.forEach((header, i) => {
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: columnWidths[i], align: 'left' });
        });
        
        doc.moveDown(0.5);
        doc.strokeColor('#000').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

    
        orders.forEach(order => {
            const baseY = doc.y;
            
            doc.font('Helvetica').fontSize(9)
               .text(order._id.toString(), 50, baseY, { width: columnWidths[0] })
               .text(order.userId?.name || 'N/A', 50 + columnWidths[0], baseY, { width: columnWidths[1] })
               .text(order.createdAt.toLocaleDateString(), 50 + columnWidths[0] + columnWidths[1], baseY, { width: columnWidths[2] })
               .text(order.items.length.toString(), 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], baseY, { width: columnWidths[3] })
               .text(`$${order.totalAmount.toFixed(2)}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], baseY, { width: columnWidths[4] })
               .text(`$${(order.discount || 0).toFixed(2)}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], baseY, { width: columnWidths[5] })
               .text(`$${(order.totalAmount - (order.discount || 0)).toFixed(2)}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5], baseY, { width: columnWidths[6] })
               .text(order.paymentMethod || 'N/A', 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + columnWidths[6], baseY, { width: columnWidths[7] })
               .text(order.items[0]?.productStatus || 'N/A', 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + columnWidths[6] + columnWidths[7], baseY, { width: columnWidths[8] });

            doc.moveDown(1);
        });

  
        doc.end();

    } catch (error) {
     
        res.status(500).send('Error generating PDF report');
    }
};