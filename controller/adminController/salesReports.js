const { render } = require('ejs');
const Order = require('../../model/orderSchema.js');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');


exports.GetsalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType, page = 1, limit = 10 } = req.query;

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

        // Pagination logic
        const skip = (page - 1) * limit;

        const orders = await Order.find(dateFilter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Total count for pagination
        const totalOrdersCount = await Order.countDocuments(dateFilter);

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
            pagination: {
                totalOrdersCount,
                currentPage: Number(page),
                totalPages: Math.ceil(totalOrdersCount / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).send('Error generating sales report');
    }
};



exports.downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate, reportType } = req.query;

        if (!reportType || !['daily', 'weekly', 'monthly', 'yearly', 'custom'].includes(reportType.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid or missing report type. Valid types: daily, weekly, monthly, yearly, custom.' });
        }

        let start, end;
        const now = new Date();


        switch (reportType.toLowerCase()) {
            case 'daily':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'weekly':
                const firstDayOfWeek = now.getDate() - now.getDay();
                start = new Date(now.setDate(firstDayOfWeek));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yearly':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    return res.status(400).json({ error: 'Start date and end date are required for custom reports.' });
                }
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type.' });
        }

        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        }).populate('userId', 'name email').lean();

        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found for the specified date range.' });
        }

        // Create an Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define worksheet columns
        worksheet.columns = [
            { header: 'Order ID', key: '_id', width: 20 },
            { header: 'Customer Name', key: 'customer', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Order Date', key: 'date', width: 15 },
            { header: 'Items Count', key: 'items', width: 15 },
            { header: 'Total Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE0' }
            };
        });

        // Add data to the worksheet
        const rows = orders.map(order => ({
            _id: order._id.toString(),
            customer: order.userId?.name || 'Guest',
            email: order.userId?.email || 'N/A',
            date: order.createdAt.toISOString().split('T')[0],
            items: order.items?.length || 0,
            amount: `$${order.totalAmount.toFixed(2)}`,
            discount: `$${(order.discount || 0).toFixed(2)}`,
            finalAmount: `$${(order.totalAmount - (order.discount || 0)).toFixed(2)}`,
            paymentMethod: order.paymentMethod || 'N/A',
            status: order.status || 'Pending'
        }));

        worksheet.addRows(rows);

        // Set the response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=sales-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};





exports.downloadPDF = async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.query;


        let start, end;
        const now = new Date();

        // Validate input
        if (reportType && !['daily', 'weekly', 'monthly', 'yearly', 'custom'].includes(reportType)) {
            return res.status(400).send('Invalid report type. Valid types are: daily, weekly, monthly, yearly, custom.');
        }

        if (reportType === 'custom') {
            if (!startDate || !endDate) {
                return res.status(400).send('Start date and end date are required for custom reports.');
            }

            start = new Date(startDate);
            end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).send('Invalid custom dates.');
            }

            end.setHours(23, 59, 59, 999)
        } else {
            // Calculate start and end dates based on the reportType
            switch (reportType) {
                case 'daily':
                    start = new Date(now.setHours(0, 0, 0, 0));
                    end = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'weekly':
                    const firstDayOfWeek = now.getDate() - now.getDay();
                    start = new Date(now.setDate(firstDayOfWeek));
                    start.setHours(0, 0, 0, 0);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6); // Saturday as end
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'monthly':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'yearly':
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31);
                    end.setHours(23, 59, 59, 999);
                    break;
                default:
                    return res.status(400).send('Report type is required.');
            }
        }

        if (!start || !end) {
            return res.status(400).send('Start and end dates could not be determined.');
        }


        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end
            }
        }).populate('userId', 'name email');


        const doc = new PDFDocument({ margin: 50 });

        // Set headers for the PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${reportType || 'custom'}-sales-report-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.pdf`
        );

        // Pipe PDF document to response
        doc.pipe(res);

        // Add Header to the PDF
        doc.fontSize(20).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12)
            .font('Helvetica')
            .text(`Report Type: ${reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) : 'Custom'}`, { align: 'center' })
            .text(`Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add Table Headers
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

        // Add Order Data
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

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).send('An error occurred while generating the report.');
    }
};
