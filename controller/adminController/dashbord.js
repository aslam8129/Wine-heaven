const Order = require('../../model/orderSchema');
// const Product = require('../../model/prodectSchema');
// const Category = require('../../model/Category');

class DashboardController {
    async getDashboardData(req, res) {
        try {
            const { filter } = req.query;
            const dateFilter = this.calculateDateRange(filter);

            const products = await this.getTopProducts(dateFilter);
            const categories = await this.getTopCategories(dateFilter);
            const salesData = await this.getSalesOverview(dateFilter);

            res.render('admin/dashboard', { 
                products, 
                categories, 
                salesData,
                filter 
            });
        } catch (error) {
           
            res.status(500).render('500');
        }
    }

    calculateDateRange(filter) {
        const now = new Date();
        let startDate, endDate;

        switch(filter) {
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            default:
                return null;
        }

        return { startDate, endDate };
    }

    async getTopProducts(dateFilter) {
        const matchStage = dateFilter 
            ? { $match: { createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } } }
            : {};

        return await Order.aggregate([
            { $unwind: "$items" },
            matchStage,
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.productName" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
    }

    async getTopCategories(dateFilter) {
        const matchStage = dateFilter 
            ? { $match: { createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } } }
            : {};

        return await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            matchStage,
            {
                $group: {
                    _id: "$categoryDetails._id",
                    name: { $first: "$categoryDetails.name" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
    }

    async getSalesOverview(dateFilter) {
     
        const matchStage = dateFilter 
            ? { $match: { createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate } } }
            : {};

        return await Order.aggregate([
            matchStage,
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);
    }
}

module.exports = new DashboardController();