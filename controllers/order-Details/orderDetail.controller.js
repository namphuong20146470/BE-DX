import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all order details with pagination and filtering
// Get all order details without pagination limits
export const getAllOrderDetails = async (req, res) => {
    try {
        const { 
            sortBy = 'ngay_dat_hang', 
            sortDir = 'desc',
            product = '',
            contract = '',
            customer = '',
            manager = '',
            orderStatus = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (product) where.ma_hang = product;
        if (contract) where.ma_hop_dong = contract;
        if (customer) where.ten_khach_hang = customer;
        if (manager) where.nguoi_phu_trach = manager;
        if (orderStatus) where.tinh_trang_don_hang = orderStatus;
        
        // Date filter
        if (startDate || endDate) {
            where.ngay_dat_hang = {};
            if (startDate) where.ngay_dat_hang.gte = new Date(startDate);
            if (endDate) where.ngay_dat_hang.lte = new Date(endDate);
        }
        
        // Get total count for metadata
        const totalCount = await prisma.order_details.count({ where });
        
        // Fetch ALL order details without pagination limits
        const orderDetails = await prisma.order_details.findMany({
            where,
            orderBy,
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                orders: true,
                customers: {
                    select: {
                        ma_khach_hang: true,
                        ten_khach_hang: true,
                        so_dien_thoai: true,
                        email: true
                    }
                }
            }
        });
        
        // Get unique product IDs from order details
        const productIds = [...new Set(orderDetails.map(detail => detail.ma_hang).filter(Boolean))];
        
        // Get products with product_type and supplier information
        const products = await prisma.products.findMany({
            where: {
                ma_hang: {
                    in: productIds
                }
            },
            select: {
                ma_hang: true,
                ten_hang: true,
                don_vi_ban_hang: true,
                gia_thuc: true,
                // Include product type information
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true,
                        mo_ta: true,
                        trang_thai: true
                    }
                },
                // Include supplier information
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true,
                        dia_chi: true,
                        so_dien_thoai: true
                    }
                }
            }
        });
        
        // Create product map for fast lookup
        const productMap = {};
        products.forEach(product => {
            productMap[product.ma_hang] = product;
        });
        
        // Add product data to order details
        const orderDetailsWithProducts = orderDetails.map(detail => {
            return {
                ...detail,
                product: detail.ma_hang ? productMap[detail.ma_hang] || null : null
            };
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách chi tiết đơn hàng thành công",
            data: orderDetailsWithProducts,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng",
            error: error.message
        });
    }
};
// Get order detail by ID
export const getOrderDetailById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const orderDetail = await prisma.order_details.findUnique({
            where: { ma_chi_tiet_don_hang: id },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            }
        });
        
        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chi tiết đơn hàng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin chi tiết đơn hàng thành công",
            data: orderDetail
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Create new order detail
export const createOrderDetail = async (req, res) => {
    try {
        const {
            ma_chi_tiet_don_hang,
            ma_hang,
            so_luong,
            ngay_dat_hang,
            ma_hop_dong,
            so_xac_nhan_don_hang,
            ten_khach_hang,
            nguoi_phu_trach,
            ngay_tam_ung,
            tu_ngay,
            den_ngay,
            tinh_trang_don_hang,
            hang_bao_ngay_du_kien_lan_1,
            hang_bao_ngay_du_kien_lan_2,
            invoice_1,
            packing_list_1,
            so_luong_lo_1,
            hawb_1,
            invoice_2,
            packing_list_2,
            so_luong_lo_2,
            hawb_2,
            invoice_3,
            packing_list_3,
            so_luong_lo_3,
            hawb_3,
            invoice_4,
            packing_list_4,
            so_luong_lo_4,
            hawb_4,
            invoice_5,
            packing_list_5,
            so_luong_lo_5,
            hawb_5,
            so_luong_hang_chua_ve,
            ghi_chu
        } = req.body;
        
        // Validate required fields
        if (!ma_chi_tiet_don_hang || !so_luong || !ngay_dat_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã chi tiết đơn hàng, số lượng và ngày đặt hàng là bắt buộc"
            });
        }
        
        // Check if order detail with this ID already exists
        const existingOrderDetail = await prisma.order_details.findUnique({
            where: { ma_chi_tiet_don_hang }
        });
        
        if (existingOrderDetail) {
            return res.status(400).json({
                success: false,
                message: `Chi tiết đơn hàng với mã ${ma_chi_tiet_don_hang} đã tồn tại`
            });
        }
        
        // Validate references
        if (ma_hop_dong) {
            const contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: ma_hop_dong }
            });
            
            if (!contract) {
                return res.status(400).json({
                    success: false,
                    message: `Hợp đồng với mã ${ma_hop_dong} không tồn tại`
                });
            }
        }
        
        if (so_xac_nhan_don_hang) {
            const order = await prisma.orders.findUnique({
                where: { so_don_hang: so_xac_nhan_don_hang }
            });
            
            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: `Đơn hàng với mã ${so_xac_nhan_don_hang} không tồn tại`
                });
            }
        }
        
        if (ten_khach_hang) {
            const customer = await prisma.customers.findUnique({
                where: { ma_khach_hang: ten_khach_hang }
            });
            
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: `Khách hàng với mã ${ten_khach_hang} không tồn tại`
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Validate bill references (hawb fields)
        const billsToCheck = [
            { field: 'hawb_1', value: hawb_1 },
            { field: 'hawb_2', value: hawb_2 },
            { field: 'hawb_3', value: hawb_3 },
            { field: 'hawb_4', value: hawb_4 },
            { field: 'hawb_5', value: hawb_5 }
        ];
        
        for (const bill of billsToCheck) {
            if (bill.value) {
                const existingBill = await prisma.bills.findUnique({
                    where: { ma_bill: bill.value }
                });
                
                if (!existingBill) {
                    return res.status(400).json({
                        success: false,
                        message: `Bill với mã ${bill.value} không tồn tại cho trường ${bill.field}`
                    });
                }
            }
        }
        
        // Get the highest stt value
        const maxSttResult = await prisma.order_details.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Create order detail
        const orderDetail = await prisma.order_details.create({
            data: {
                stt: nextStt,
                ma_chi_tiet_don_hang,
                ma_hang,
                so_luong: parseInt(so_luong),
                ngay_dat_hang: new Date(ngay_dat_hang),
                ma_hop_dong,
                so_xac_nhan_don_hang,
                ten_khach_hang,
                nguoi_phu_trach,
                ngay_tam_ung: ngay_tam_ung ? new Date(ngay_tam_ung) : null,
                tu_ngay: tu_ngay ? new Date(tu_ngay) : null,
                den_ngay: den_ngay ? new Date(den_ngay) : null,
                tinh_trang_don_hang,
                hang_bao_ngay_du_kien_lan_1: hang_bao_ngay_du_kien_lan_1 ? new Date(hang_bao_ngay_du_kien_lan_1) : null,
                hang_bao_ngay_du_kien_lan_2: hang_bao_ngay_du_kien_lan_2 ? new Date(hang_bao_ngay_du_kien_lan_2) : null,
                invoice_1,
                packing_list_1,
                so_luong_lo_1: so_luong_lo_1 ? parseInt(so_luong_lo_1) : null,
                hawb_1,
                invoice_2,
                packing_list_2,
                so_luong_lo_2: so_luong_lo_2 ? parseInt(so_luong_lo_2) : null,
                hawb_2,
                invoice_3,
                packing_list_3,
                so_luong_lo_3: so_luong_lo_3 ? parseInt(so_luong_lo_3) : null,
                hawb_3,
                invoice_4,
                packing_list_4,
                so_luong_lo_4: so_luong_lo_4 ? parseInt(so_luong_lo_4) : null,
                hawb_4,
                invoice_5,
                packing_list_5,
                so_luong_lo_5: so_luong_lo_5 ? parseInt(so_luong_lo_5) : null,
                hawb_5,
                so_luong_hang_chua_ve: so_luong_hang_chua_ve ? parseInt(so_luong_hang_chua_ve) : null,
                ghi_chu
            }
        });
        
        // If this is part of an order, update the order's total value
        if (so_xac_nhan_don_hang && ma_hang) {
            try {
                // Get product price
                const product = await prisma.products.findFirst({
                    where: { ma_hang }
                });
                
                if (product) {
                    const orderValue = product.gia_thuc * parseInt(so_luong);
                    
                    // Update order's total value
                    await prisma.orders.update({
                        where: { so_don_hang: so_xac_nhan_don_hang },
                        data: {
                            tong_gia_tri_don_hang: {
                                increment: orderValue
                            }
                        }
                    });
                }
            } catch (orderUpdateError) {
                console.error('Error updating order value:', orderUpdateError);
                // Continue with the response even if order update fails
            }
        }
        
        res.status(201).json({
            success: true,
            message: "Tạo chi tiết đơn hàng thành công",
            data: orderDetail
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Update order detail
export const updateOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ma_hang,
            so_luong,
            ngay_dat_hang,
            ma_hop_dong,
            so_xac_nhan_don_hang,
            ten_khach_hang,
            nguoi_phu_trach,
            ngay_tam_ung,
            tu_ngay,
            den_ngay,
            tinh_trang_don_hang,
            hang_bao_ngay_du_kien_lan_1,
            hang_bao_ngay_du_kien_lan_2,
            invoice_1,
            packing_list_1,
            so_luong_lo_1,
            hawb_1,
            invoice_2,
            packing_list_2,
            so_luong_lo_2,
            hawb_2,
            invoice_3,
            packing_list_3,
            so_luong_lo_3,
            hawb_3,
            invoice_4,
            packing_list_4,
            so_luong_lo_4,
            hawb_4,
            invoice_5,
            packing_list_5,
            so_luong_lo_5,
            hawb_5,
            so_luong_hang_chua_ve,
            ghi_chu
        } = req.body;
        
        // Check if order detail exists
        const existingOrderDetail = await prisma.order_details.findUnique({
            where: { ma_chi_tiet_don_hang: id }
        });
        
        if (!existingOrderDetail) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chi tiết đơn hàng"
            });
        }
        
        // Calculate quantity difference for order value update
        const quantityDifference = so_luong 
            ? parseInt(so_luong) - existingOrderDetail.so_luong 
            : 0;
        
        // Validate references
        if (ma_hop_dong) {
            const contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: ma_hop_dong }
            });
            
            if (!contract) {
                return res.status(400).json({
                    success: false,
                    message: `Hợp đồng với mã ${ma_hop_dong} không tồn tại`
                });
            }
        }
        
        if (so_xac_nhan_don_hang) {
            const order = await prisma.orders.findUnique({
                where: { so_don_hang: so_xac_nhan_don_hang }
            });
            
            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: `Đơn hàng với mã ${so_xac_nhan_don_hang} không tồn tại`
                });
            }
        }
        
        if (ten_khach_hang) {
            const customer = await prisma.customers.findUnique({
                where: { ma_khach_hang: ten_khach_hang }
            });
            
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: `Khách hàng với mã ${ten_khach_hang} không tồn tại`
                });
            }
        }
        
        if (nguoi_phu_trach) {
            const account = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: `Tài khoản với mã ${nguoi_phu_trach} không tồn tại`
                });
            }
        }
        
        // Validate bill references (hawb fields)
        const billsToCheck = [
            { field: 'hawb_1', value: hawb_1 },
            { field: 'hawb_2', value: hawb_2 },
            { field: 'hawb_3', value: hawb_3 },
            { field: 'hawb_4', value: hawb_4 },
            { field: 'hawb_5', value: hawb_5 }
        ];
        
        for (const bill of billsToCheck) {
            if (bill.value) {
                const existingBill = await prisma.bills.findUnique({
                    where: { ma_bill: bill.value }
                });
                
                if (!existingBill) {
                    return res.status(400).json({
                        success: false,
                        message: `Bill với mã ${bill.value} không tồn tại cho trường ${bill.field}`
                    });
                }
            }
        }
        
        // Update order detail
        const updatedOrderDetail = await prisma.order_details.update({
            where: { ma_chi_tiet_don_hang: id },
            data: {
                ma_hang,
                so_luong: so_luong ? parseInt(so_luong) : undefined,
                ngay_dat_hang: ngay_dat_hang ? new Date(ngay_dat_hang) : undefined,
                ma_hop_dong,
                so_xac_nhan_don_hang,
                ten_khach_hang,
                nguoi_phu_trach,
                ngay_tam_ung: ngay_tam_ung ? new Date(ngay_tam_ung) : undefined,
                tu_ngay: tu_ngay ? new Date(tu_ngay) : undefined,
                den_ngay: den_ngay ? new Date(den_ngay) : undefined,
                tinh_trang_don_hang,
                hang_bao_ngay_du_kien_lan_1: hang_bao_ngay_du_kien_lan_1 ? new Date(hang_bao_ngay_du_kien_lan_1) : undefined,
                hang_bao_ngay_du_kien_lan_2: hang_bao_ngay_du_kien_lan_2 ? new Date(hang_bao_ngay_du_kien_lan_2) : undefined,
                invoice_1,
                packing_list_1,
                so_luong_lo_1: so_luong_lo_1 ? parseInt(so_luong_lo_1) : undefined,
                hawb_1,
                invoice_2,
                packing_list_2,
                so_luong_lo_2: so_luong_lo_2 ? parseInt(so_luong_lo_2) : undefined,
                hawb_2,
                invoice_3,
                packing_list_3,
                so_luong_lo_3: so_luong_lo_3 ? parseInt(so_luong_lo_3) : undefined,
                hawb_3,
                invoice_4,
                packing_list_4,
                so_luong_lo_4: so_luong_lo_4 ? parseInt(so_luong_lo_4) : undefined,
                hawb_4,
                invoice_5,
                packing_list_5,
                so_luong_lo_5: so_luong_lo_5 ? parseInt(so_luong_lo_5) : undefined,
                hawb_5,
                so_luong_hang_chua_ve: so_luong_hang_chua_ve ? parseInt(so_luong_hang_chua_ve) : undefined,
                ghi_chu
            }
        });
        
        // If this is part of an order and the quantity or product changed, update the order's total value
        if (quantityDifference !== 0 && 
            existingOrderDetail.so_xac_nhan_don_hang && 
            (ma_hang || existingOrderDetail.ma_hang)) {
            try {
                const productId = ma_hang || existingOrderDetail.ma_hang;
                const orderId = so_xac_nhan_don_hang || existingOrderDetail.so_xac_nhan_don_hang;
                
                // Get product price
                const product = await prisma.products.findFirst({
                    where: { ma_hang: productId }
                });
                
                if (product) {
                    const orderValueChange = product.gia_thuc * quantityDifference;
                    
                    // Update order's total value
                    await prisma.orders.update({
                        where: { so_don_hang: orderId },
                        data: {
                            tong_gia_tri_don_hang: {
                                increment: orderValueChange
                            }
                        }
                    });
                }
            } catch (orderUpdateError) {
                console.error('Error updating order value:', orderUpdateError);
                // Continue with the response even if order update fails
            }
        }
        
        // If the order changed, need to update both old and new order totals
        if (so_xac_nhan_don_hang && 
            existingOrderDetail.so_xac_nhan_don_hang && 
            so_xac_nhan_don_hang !== existingOrderDetail.so_xac_nhan_don_hang) {
            try {
                const productId = existingOrderDetail.ma_hang;
                
                // Get product price
                const product = await prisma.products.findFirst({
                    where: { ma_hang: productId }
                });
                
                if (product) {
                    // Subtract from old order
                    await prisma.orders.update({
                        where: { so_don_hang: existingOrderDetail.so_xac_nhan_don_hang },
                        data: {
                            tong_gia_tri_don_hang: {
                                decrement: product.gia_thuc * existingOrderDetail.so_luong
                            }
                        }
                    });
                    
                    // Add to new order
                    await prisma.orders.update({
                        where: { so_don_hang: so_xac_nhan_don_hang },
                        data: {
                            tong_gia_tri_don_hang: {
                                increment: product.gia_thuc * (so_luong ? parseInt(so_luong) : existingOrderDetail.so_luong)
                            }
                        }
                    });
                }
            } catch (orderUpdateError) {
                console.error('Error updating order values for order change:', orderUpdateError);
                // Continue with the response even if order update fails
            }
        }
        
        res.json({
            success: true,
            message: "Cập nhật chi tiết đơn hàng thành công",
            data: updatedOrderDetail
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Delete order detail
export const deleteOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if order detail exists
        const orderDetail = await prisma.order_details.findUnique({
            where: { ma_chi_tiet_don_hang: id }
        });
        
        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chi tiết đơn hàng"
            });
        }
        
        // Delete order detail
        await prisma.order_details.delete({
            where: { ma_chi_tiet_don_hang: id }
        });
        
        // If this was part of an order, update the order's total value
        if (orderDetail.so_xac_nhan_don_hang && orderDetail.ma_hang) {
            try {
                // Get product price
                const product = await prisma.products.findFirst({
                    where: { ma_hang: orderDetail.ma_hang }
                });
                
                if (product) {
                    const orderValue = product.gia_thuc * orderDetail.so_luong;
                    
                    // Update order's total value
                    await prisma.orders.update({
                        where: { so_don_hang: orderDetail.so_xac_nhan_don_hang },
                        data: {
                            tong_gia_tri_don_hang: {
                                decrement: orderValue
                            }
                        }
                    });
                }
            } catch (orderUpdateError) {
                console.error('Error updating order value:', orderUpdateError);
                // Continue with the response even if order update fails
            }
        }
        
        res.json({
            success: true,
            message: "Xóa chi tiết đơn hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Get order details by customer
export const getOrderDetailsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const orderDetails = await prisma.order_details.findMany({
            where: { ten_khach_hang: customerId },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            },
            orderBy: { ngay_dat_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách chi tiết đơn hàng cho khách hàng ${customerId} thành công`,
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng theo khách hàng",
            error: error.message
        });
    }
};

// Get order details by contract
export const getOrderDetailsByContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        
        const orderDetails = await prisma.order_details.findMany({
            where: { ma_hop_dong: contractId },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            },
            orderBy: { ngay_dat_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách chi tiết đơn hàng cho hợp đồng ${contractId} thành công`,
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng theo hợp đồng",
            error: error.message
        });
    }
};

// Get order details by product
export const getOrderDetailsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const orderDetails = await prisma.order_details.findMany({
            where: { ma_hang: productId },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            },
            orderBy: { ngay_dat_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách chi tiết đơn hàng cho sản phẩm ${productId} thành công`,
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng theo sản phẩm",
            error: error.message
        });
    }
};

// Get order details by bill
export const getOrderDetailsByBill = async (req, res) => {
    try {
        const { billId } = req.params;
        
        const orderDetails = await prisma.order_details.findMany({
            where: {
                OR: [
                    { hawb_1: billId },
                    { hawb_2: billId },
                    { hawb_3: billId },
                    { hawb_4: billId },
                    { hawb_5: billId }
                ]
            },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            },
            orderBy: { ngay_dat_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách chi tiết đơn hàng cho bill ${billId} thành công`,
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng theo bill",
            error: error.message
        });
    }
};

// Get order details by manager
export const getOrderDetailsByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        
        const orderDetails = await prisma.order_details.findMany({
            where: { nguoi_phu_trach: managerId },
            include: {
                bills_order_details_hawb_1Tobills: true,
                bills_order_details_hawb_2Tobills: true,
                bills_order_details_hawb_3Tobills: true,
                bills_order_details_hawb_4Tobills: true,
                bills_order_details_hawb_5Tobills: true,
                contracts: true,
                accounts: true,
                orders: true,
                customers: true
            },
            orderBy: { ngay_dat_hang: 'desc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách chi tiết đơn hàng cho người phụ trách ${managerId} thành công`,
            data: orderDetails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách chi tiết đơn hàng theo người phụ trách",
            error: error.message
        });
    }
};

// Get order details stats
export const getOrderDetailsStats = async (req, res) => {
    try {
        // Count total order details
        const totalOrderDetails = await prisma.order_details.count();
        
        // Count details in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrderDetails = await prisma.order_details.count({
            where: {
                ngay_dat_hang: {
                    gte: thirtyDaysAgo
                }
            }
        });
        
        // Get total quantity ordered
        const totalQuantity = await prisma.order_details.aggregate({
            _sum: {
                so_luong: true
            }
        });
        
        // Get top 5 customers by quantity
        const topCustomers = await prisma.order_details.groupBy({
            by: ['ten_khach_hang'],
            _sum: {
                so_luong: true
            },
            orderBy: {
                _sum: {
                    so_luong: 'desc'
                }
            },
            take: 5
        });
        
        // Get top 5 products by quantity
        const topProducts = await prisma.order_details.groupBy({
            by: ['ma_hang'],
            _sum: {
                so_luong: true
            },
            orderBy: {
                _sum: {
                    so_luong: 'desc'
                }
            },
            take: 5
        });
        
        // Get monthly statistics for the current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        
        const monthlyStats = await prisma.order_details.groupBy({
            by: [
                {
                    ngay_dat_hang: {
                        month: true
                    }
                }
            ],
            where: {
                ngay_dat_hang: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            _sum: {
                so_luong: true
            },
            _count: {
                ma_chi_tiet_don_hang: true
            }
        });
        
        // Get order status statistics
        const orderStatusStats = await prisma.order_details.groupBy({
            by: ['tinh_trang_don_hang'],
            _count: {
                ma_chi_tiet_don_hang: true
            }
        });
        
        // Get customer names for top customers
        const customerDetails = await Promise.all(
            topCustomers.map(async (item) => {
                if (!item.ten_khach_hang) {
                    return {
                        ten_khach_hang: null,
                        ten_khach_hang_day_du: 'Không xác định',
                        quantity: item._sum.so_luong
                    };
                }
                
                const customer = await prisma.customers.findUnique({
                    where: { ma_khach_hang: item.ten_khach_hang },
                    select: { ten_khach_hang: true }
                });
                
                return {
                    ten_khach_hang: item.ten_khach_hang,
                    ten_khach_hang_day_du: customer?.ten_khach_hang || 'Không xác định',
                    quantity: item._sum.so_luong
                };
            })
        );
        
        // Format monthly data
        const monthlyData = Array(12).fill(0).map((_, i) => {
            const month = i + 1;
            const monthData = monthlyStats.find(stat => stat.ngay_dat_hang.month === month);
            return {
                month,
                quantity: monthData?._sum.so_luong || 0,
                count: monthData?._count.ma_chi_tiet_don_hang || 0
            };
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê chi tiết đơn hàng thành công",
            data: {
                totalOrderDetails,
                recentOrderDetails,
                totalQuantity: totalQuantity._sum.so_luong || 0,
                topCustomers: customerDetails,
                topProducts,
                monthlyData,
                orderStatusStats
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê chi tiết đơn hàng",
            error: error.message
        });
    }
};

// Setup multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `import-${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /xlsx|xls/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'));
        }
    }
}).single('file');

// Import order details from Excel
export const importOrderDetailsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng tải lên tệp Excel"
            });
        }
        
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Tệp Excel không có dữ liệu"
            });
        }
        
        // Process and validate data
        const results = {
            success: [],
            errors: []
        };
        
        // Get the current highest stt value
        const maxSttResult = await prisma.order_details.aggregate({
            _max: {
                stt: true
            }
        });
        
        let nextStt = (maxSttResult._max.stt || 0) + 1;
        
        // Process each record in Excel file
        for (const [index, item] of data.entries()) {
            try {
                // Check required fields
                if (!item['Mã chi tiết đơn hàng'] || !item['Số lượng'] || !item['Ngày đặt hàng']) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: "Thiếu thông tin bắt buộc: Mã chi tiết đơn hàng, Số lượng, Ngày đặt hàng"
                    });
                    continue;
                }
                
                // Check if order detail already exists
                const existingOrderDetail = await prisma.order_details.findUnique({
                    where: { ma_chi_tiet_don_hang: item['Mã chi tiết đơn hàng'] }
                });
                
                if (existingOrderDetail) {
                    results.errors.push({
                        row: index + 1,
                        data: item,
                        error: `Chi tiết đơn hàng với mã ${item['Mã chi tiết đơn hàng']} đã tồn tại`
                    });
                    continue;
                }
                
                // Validate references
                let validationError = false;
                
                if (item['Mã hợp đồng']) {
                    const contract = await prisma.contracts.findUnique({
                        where: { so_hop_dong: item['Mã hợp đồng'] }
                    });
                    
                    if (!contract) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Hợp đồng với mã ${item['Mã hợp đồng']} không tồn tại`
                        });
                        validationError = true;
                        continue;
                    }
                }
                
                if (item['Số xác nhận đơn hàng']) {
                    const order = await prisma.orders.findUnique({
                        where: { so_don_hang: item['Số xác nhận đơn hàng'] }
                    });
                    
                    if (!order) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Đơn hàng với mã ${item['Số xác nhận đơn hàng']} không tồn tại`
                        });
                        validationError = true;
                        continue;
                    }
                }
                
                if (item['Mã khách hàng']) {
                    const customer = await prisma.customers.findUnique({
                        where: { ma_khach_hang: item['Mã khách hàng'] }
                    });
                    
                    if (!customer) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Khách hàng với mã ${item['Mã khách hàng']} không tồn tại`
                        });
                        validationError = true;
                        continue;
                    }
                }
                
                if (item['Người phụ trách']) {
                    const account = await prisma.accounts.findUnique({
                        where: { ma_nguoi_dung: item['Người phụ trách'] }
                    });
                    
                    if (!account) {
                        results.errors.push({
                            row: index + 1,
                            data: item,
                            error: `Tài khoản với mã ${item['Người phụ trách']} không tồn tại`
                        });
                        validationError = true;
                        continue;
                    }
                }
                
                // Validate bill references (hawb fields)
                const billsToCheck = [
                    { field: 'HAWB 1', value: item['HAWB 1'] },
                    { field: 'HAWB 2', value: item['HAWB 2'] },
                    { field: 'HAWB 3', value: item['HAWB 3'] },
                    { field: 'HAWB 4', value: item['HAWB 4'] },
                    { field: 'HAWB 5', value: item['HAWB 5'] }
                ];
                
                for (const bill of billsToCheck) {
                    if (bill.value) {
                        const existingBill = await prisma.bills.findUnique({
                            where: { ma_bill: bill.value }
                        });
                        
                        if (!existingBill) {
                            results.errors.push({
                                row: index + 1,
                                data: item,
                                error: `Bill với mã ${bill.value} không tồn tại cho trường ${bill.field}`
                            });
                            validationError = true;
                            break;
                        }
                    }
                }
                
                if (validationError) continue;
                
                // Create order detail
                const orderDetail = await prisma.order_details.create({
                    data: {
                        stt: nextStt++,
                        ma_chi_tiet_don_hang: item['Mã chi tiết đơn hàng'],
                        ma_hang: item['Mã hàng'] || null,
                        so_luong: parseInt(item['Số lượng']),
                        ngay_dat_hang: new Date(item['Ngày đặt hàng']),
                        ma_hop_dong: item['Mã hợp đồng'] || null,
                        so_xac_nhan_don_hang: item['Số xác nhận đơn hàng'] || null,
                        ten_khach_hang: item['Mã khách hàng'] || null,
                        nguoi_phu_trach: item['Người phụ trách'] || null,
                        ngay_tam_ung: item['Ngày tạm ứng'] ? new Date(item['Ngày tạm ứng']) : null,
                        tu_ngay: item['Từ ngày'] ? new Date(item['Từ ngày']) : null,
                        den_ngay: item['Đến ngày'] ? new Date(item['Đến ngày']) : null,
                        tinh_trang_don_hang: item['Tình trạng đơn hàng'] || null,
                        hang_bao_ngay_du_kien_lan_1: item['Hàng báo ngày dự kiến lần 1'] ? new Date(item['Hàng báo ngày dự kiến lần 1']) : null,
                        hang_bao_ngay_du_kien_lan_2: item['Hàng báo ngày dự kiến lần 2'] ? new Date(item['Hàng báo ngày dự kiến lần 2']) : null,
                        invoice_1: item['Invoice 1'] || null,
                        packing_list_1: item['Packing List 1'] || null,
                        so_luong_lo_1: item['Số lượng lô 1'] ? parseInt(item['Số lượng lô 1']) : null,
                        hawb_1: item['HAWB 1'] || null,
                        invoice_2: item['Invoice 2'] || null,
                        packing_list_2: item['Packing List 2'] || null,
                        so_luong_lo_2: item['Số lượng lô 2'] ? parseInt(item['Số lượng lô 2']) : null,
                        hawb_2: item['HAWB 2'] || null,
                        invoice_3: item['Invoice 3'] || null,
                        packing_list_3: item['Packing List 3'] || null,
                        so_luong_lo_3: item['Số lượng lô 3'] ? parseInt(item['Số lượng lô 3']) : null,
                        hawb_3: item['HAWB 3'] || null,
                        invoice_4: item['Invoice 4'] || null,
                        packing_list_4: item['Packing List 4'] || null,
                        so_luong_lo_4: item['Số lượng lô 4'] ? parseInt(item['Số lượng lô 4']) : null,
                        hawb_4: item['HAWB 4'] || null,
                        invoice_5: item['Invoice 5'] || null,
                        packing_list_5: item['Packing List 5'] || null,
                        so_luong_lo_5: item['Số lượng lô 5'] ? parseInt(item['Số lượng lô 5']) : null,
                        hawb_5: item['HAWB 5'] || null,
                        so_luong_hang_chua_ve: item['Số lượng hàng chưa về'] ? parseInt(item['Số lượng hàng chưa về']) : null,
                        ghi_chu: item['Ghi chú'] || null
                    }
                });
                
                // If this is part of an order, update the order's total value
                if (item['Số xác nhận đơn hàng'] && item['Mã hàng']) {
                    try {
                        // Get product price
                        const product = await prisma.products.findFirst({
                            where: { ma_hang: item['Mã hàng'] }
                        });
                        
                        if (product) {
                            const orderValue = product.gia_thuc * parseInt(item['Số lượng']);
                            
                            // Update order's total value
                            await prisma.orders.update({
                                where: { so_don_hang: item['Số xác nhận đơn hàng'] },
                                data: {
                                    tong_gia_tri_don_hang: {
                                        increment: orderValue
                                    }
                                }
                            });
                        }
                    } catch (orderUpdateError) {
                        console.error('Error updating order value:', orderUpdateError);
                    }
                }
                
                results.success.push(orderDetail);
            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
                results.errors.push({
                    row: index + 1,
                    data: item,
                    error: error.message
                });
            }
        }
        
        // Remove temporary file
        fs.unlinkSync(req.file.path);
        
        // Return results
        return res.json({
            success: true,
            message: `Import thành công ${results.success.length} chi tiết đơn hàng, thất bại ${results.errors.length} chi tiết đơn hàng`,
            data: {
                successCount: results.success.length,
                errorCount: results.errors.length,
                successItems: results.success,
                errorItems: results.errors
            }
        });
    } catch (error) {
        console.error('Import error:', error);
        
        // Remove temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
            success: false,
            message: "Lỗi khi import chi tiết đơn hàng từ Excel",
            error: error.message
        });
    }
};

// Generate template Excel file for order details
export const generateOrderDetailTemplate = (req, res) => {
    try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Define columns
        const headers = [
            'Mã chi tiết đơn hàng',
            'Mã hàng',
            'Số lượng',
            'Ngày đặt hàng',
            'Mã hợp đồng',
            'Số xác nhận đơn hàng',
            'Mã khách hàng',
            'Người phụ trách',
            'Ngày tạm ứng',
            'Từ ngày',
            'Đến ngày',
            'Tình trạng đơn hàng',
            'Hàng báo giá dự kiến lần 1',
            'Hàng báo giá dự kiến lần 2',
            'Invoice 1',
            'Packing List 1',
            'Số lượng lô 1',
            'HAWB 1',
            'Invoice 2',
            'Packing List 2',
            'Số lượng lô 2',
            'HAWB 2',
            'Invoice 3',
            'Packing List 3',
            'Số lượng lô 3',
            'HAWB 3',
            'Invoice 4',
            'Packing List 4',
            'Số lượng lô 4',
            'HAWB 4',
            'Invoice 5',
            'Packing List 5',
            'Số lượng lô 5',
            'HAWB 5',
            'Số lượng hàng chưa về',
            'Ghi chú'
        ];
        
        // Create a sample row
        const sampleData = [{
            'Mã chi tiết đơn hàng': 'CTDH001',
            'Mã hàng': 'SP001',
            'Số lượng': 10,
            'Ngày đặt hàng': '2025-04-22',
            'Mã hợp đồng': 'HD001',
            'Số xác nhận đơn hàng': 'DH001',
            'Mã khách hàng': 'KH001',
            'Người phụ trách': 'USER001',
            'Ngày tạm ứng': '2025-04-20',
            'Từ ngày': '2025-04-22',
            'Đến ngày': '2025-05-22',
            'Tình trạng đơn hàng': 'Đang xử lý',
            'Hàng báo giá dự kiến lần 1': '2025-04-25',
            'Hàng báo giá dự kiến lần 2': '2025-04-30',
            'Invoice 1': 'INV001',
            'Packing List 1': 'PL001',
            'Số lượng lô 1': 5,
            'HAWB 1': 'BILL001',
            'Invoice 2': 'INV002',
            'Packing List 2': 'PL002',
            'Số lượng lô 2': 5,
            'HAWB 2': 'BILL002',
            'Số lượng hàng chưa về': 0,
            'Ghi chú': 'Đơn hàng mẫu'
        }];
        
        // Create worksheet with data
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Add column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Chi tiết đơn hàng');
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=order_details_template.xlsx');
        
        // Write workbook to response
        const buffer = XLSX.write(wb, { type: 'buffer' });
        res.send(buffer);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo file mẫu',
            error: error.message
        });
    }
};