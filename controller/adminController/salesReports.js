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
        const { startDate, endDate, reportType } = req.query;

        // Improved date range calculation with more robust logic
        const { start, end } = calculateDateRange(startDate, endDate, reportType);

        // Validate date range
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Please provide valid start and end dates'
            });
        }

       
        const orders = await fetchOrdersInRange(start, end);

        // Generate PDF
        const pdfDoc = await generateSalesReportPDF(orders, start, end);

  
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${formatFilenameDate(start)}-${formatFilenameDate(end)}.pdf`);

  
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
     
        res.status(500).json({
            error: 'PDF Generation Failed',
            message: 'Unable to generate sales report PDF',
            details: error.message
        });
    }
};


function calculateDateRange(startDate, endDate, reportType) {
    let start = new Date(startDate);
    let end;

    switch (reportType) {
        case 'daily':
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            let dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            start.setDate(1);
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            break;
        default:
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
    }

    return { start, end };
}


async function fetchOrdersInRange(start, end) {
    return await Order.find({
        createdAt: {
            $gte: start,
            $lt: end
        }
    }).populate('userId', 'name email');
}



 
    async function generateSalesReportPDF(orders, start, end) {
        const doc = new PDFDocument({ 
            margin: 50,
            bufferPages: true 
        });
    
        
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('Sales Report', { 
               align: 'center', 
               x: 50 
           });
    
        doc.moveDown(0.5);
    
        
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(`Report Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, { 
               align: 'center', 
               x: 50, 
               underline: true 
           });
    
        doc.moveDown(2);
    
       
        const headers = [
            'Order ID', 'Customer', 'Date', 
            'Items', 'Total', 'Discount', 
            'Final Amount', 'Payment', 'Status'
        ];
        const columnWidths = [90, 90, 40, 35, 80, 50, 70, 70, 60];
    
        
        doc.fillColor('#ECF0F1')
           .rect(50, doc.y, 550, 20)
           .fill();
    
        doc.fillColor('#2C3E50');
        let currentX = 50;
        headers.forEach((header, i) => {
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .text(header, 
                   currentX, 
                   doc.y + 5, 
                   { width: columnWidths[i], align: 'left' }
               );
            currentX += columnWidths[i];
        });
        doc.moveDown(1.5);
    
       
        orders.forEach((order, index) => {
            const baseY = doc.y;
            const rowColor = index % 2 === 0 ? '#F9F9F9' : '#FFFFFF';
    
           
            doc.fillColor(rowColor)
               .rect(50, baseY, 500, 20)
               .fill();
    
            doc.fillColor('#2C3E50')
               .font('Helvetica')
               .fontSize(9);
    
         
            renderOrderRow(doc, order, columnWidths, baseY);
        });
    
        
        addReportSummary(doc, orders);
    
        // Add page numbers
        addPageNumbers(doc);
    
        return doc;
    }
function renderOrderRow(doc, order, columnWidths, baseY) {
    let currentX = 50;
    const details = [
        order._id.toString(),
        order.userId?.name || 'N/A',
        order.createdAt.toLocaleDateString(),
        order.items.length.toString(),
        `$${order.totalAmount.toFixed(2)}`,
        `$${(order.discount || 0).toFixed(2)}`,
        `$${(order.totalAmount - (order.discount || 0)).toFixed(2)}`,
        order.paymentMethod || 'N/A',
        order.items[0]?.productStatus || 'N/A'
    ];

    details.forEach((detail, index) => {
        doc.text(detail, currentX, baseY, {
            width: columnWidths[index],
            align: 'left' 
        });
        currentX += columnWidths[index];
    });
}

function addReportSummary(doc, orders) {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

    doc.moveDown(2);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2C3E50')
       .text('Report Summary', { align: 'center' });

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Total Orders: ${orders.length}`, { align: 'center' })
       .text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'center' })
       .text(`Total Discounts: $${totalDiscount.toFixed(2)}`, { align: 'center' });
}


function addPageNumbers(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10)
           .fillColor('#7F8C8D')
           .text(`Page ${i + 1} of ${pages.count}`, 
               doc.page.width / 2 - 50, 
               doc.page.height - 30, 
               { align: 'center' }
           );
    }
}


function formatFilenameDate(date) {
    return date.toISOString().split('T')[0];
}