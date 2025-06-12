import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all potential customers with pagination and filtering
// Get all potential customers without pagination limits
export const getAllPotentialCustomers = async (req, res) => {
    try {
        const { 
            sortBy = 'stt', 
            sortDir = 'asc',
            search = '',
            status = '',
            group = '',
            source = '',
            manager = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_khach_hang_tiem_nang: { contains: search, mode: 'insensitive' } },
                { ten_khach_hang: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { so_dien_thoai: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (status) where.tinh_trang = status;
        if (group) where.nhom_khach_hang = group;
        if (source) where.nguon_tiep_can = source;
        if (manager) where.nguoi_phu_trach = manager;
        
        // Date filter for next contact date
        if (startDate || endDate) {
            where.ngay_them_vao = {};
            if (startDate) where.ngay_them_vao.gte = new Date(startDate);
            if (endDate) where.ngay_them_vao.lte = new Date(endDate);
        }
        
        // Get total count for metadata
        const totalCount = await prisma.potential_customer.count({ where });
        
        // Fetch ALL potential customers without pagination limits
        const potentialCustomers = await prisma.potential_customer.findMany({
            where,
            orderBy,
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                customer_group: {
                    select: {
                        ma_nhom_khach_hang: true,
                        nhom_khach_hang: true
                    }
                },
                opportunity_source: {
                    select: {
                        ma_nguon: true,
                        nguon: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách khách hàng tiềm năng thành công",
            data: potentialCustomers,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách khách hàng tiềm năng",
            error: error.message
        });
    }
};

// Get potential customer by ID
export const getPotentialCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const potentialCustomer = await prisma.potential_customer.findUnique({
            where: { ma_khach_hang_tiem_nang: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                customer_group: {
                    select: {
                        ma_nhom_khach_hang: true,
                        nhom_khach_hang: true
                    }
                },
                opportunity_source: {
                    select: {
                        ma_nguon: true,
                        nguon: true
                    }
                }
            }
        });
        
        if (!potentialCustomer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng tiềm năng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin khách hàng tiềm năng thành công",
            data: potentialCustomer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin khách hàng tiềm năng",
            error: error.message
        });
    }
};

// Create potential customer
export const createPotentialCustomer = async (req, res) => {
    try {
        const { 
            ma_khach_hang_tiem_nang, 
            ten_khach_hang, 
            nguoi_phu_trach,
            hanh_dong_tiep_theo,
            ngay_lien_lac_tiep_theo,
            so_lan_da_lien_lac = 0,
            muc_dich,
            nhom_khach_hang,
            nguon_tiep_can,
            tinh_trang,
            ngay_them_vao,
            email,
            so_dien_thoai,
            website,
            dia_chi_cu_the,
            tinh_thanh,
            ghi_chu
        } = req.body;
        
        // Validate required fields
        if (!ma_khach_hang_tiem_nang || !ten_khach_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã khách hàng tiềm năng và tên khách hàng là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingCustomer = await prisma.potential_customer.findUnique({
            where: { ma_khach_hang_tiem_nang }
        });
        
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Mã khách hàng tiềm năng đã tồn tại"
            });
        }
        
        // Check if name already exists
        const existingName = await prisma.potential_customer.findFirst({
            where: { ten_khach_hang }
        });
        
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Tên khách hàng tiềm năng đã tồn tại"
            });
        }
        
        // Validate references if provided
        if (nguoi_phu_trach) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        if (nhom_khach_hang) {
            const group = await prisma.customer_group.findUnique({
                where: { ma_nhom_khach_hang: nhom_khach_hang }
            });
            
            if (!group) {
                return res.status(400).json({
                    success: false,
                    message: "Nhóm khách hàng không tồn tại"
                });
            }
        }
        
        if (nguon_tiep_can) {
            const source = await prisma.opportunity_source.findUnique({
                where: { ma_nguon: nguon_tiep_can }
            });
            
            if (!source) {
                return res.status(400).json({
                    success: false,
                    message: "Nguồn tiếp cận không tồn tại"
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.potential_customer.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new potential customer
        const potentialCustomer = await prisma.potential_customer.create({
            data: {
                stt: nextStt,
                ma_khach_hang_tiem_nang,
                ten_khach_hang,
                nguoi_phu_trach,
                hanh_dong_tiep_theo,
                ngay_lien_lac_tiep_theo: ngay_lien_lac_tiep_theo ? new Date(ngay_lien_lac_tiep_theo) : null,
                so_lan_da_lien_lac: parseInt(so_lan_da_lien_lac),
                muc_dich,
                nhom_khach_hang,
                nguon_tiep_can,
                tinh_trang: tinh_trang || 'Mới',
                ngay_them_vao: ngay_them_vao ? new Date(ngay_them_vao) : new Date(),
                email,
                so_dien_thoai,
                website,
                dia_chi_cu_the,
                tinh_thanh,
                ghi_chu
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                customer_group: {
                    select: {
                        nhom_khach_hang: true
                    }
                },
                opportunity_source: {
                    select: {
                        nguon: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo khách hàng tiềm năng thành công",
            data: potentialCustomer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo khách hàng tiềm năng",
            error: error.message
        });
    }
};

// Update potential customer
export const updatePotentialCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_khach_hang, 
            nguoi_phu_trach,
            hanh_dong_tiep_theo,
            ngay_lien_lac_tiep_theo,
            so_lan_da_lien_lac,
            muc_dich,
            nhom_khach_hang,
            nguon_tiep_can,
            tinh_trang,
            email,
            so_dien_thoai,
            website,
            dia_chi_cu_the,
            tinh_thanh,
            ghi_chu
        } = req.body;
        
        // Check if potential customer exists
        const existingCustomer = await prisma.potential_customer.findUnique({
            where: { ma_khach_hang_tiem_nang: id }
        });
        
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng tiềm năng"
            });
        }
        
        // Check if name already exists and belongs to a different record
        if (ten_khach_hang) {
            const existingName = await prisma.potential_customer.findFirst({
                where: { 
                    ten_khach_hang,
                    ma_khach_hang_tiem_nang: { not: id }
                }
            });
            
            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: "Tên khách hàng tiềm năng đã tồn tại"
                });
            }
        }
        
        // Validate references if provided
        if (nguoi_phu_trach) {
            const manager = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_phu_trach }
            });
            
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: "Người phụ trách không tồn tại"
                });
            }
        }
        
        if (nhom_khach_hang) {
            const group = await prisma.customer_group.findUnique({
                where: { ma_nhom_khach_hang: nhom_khach_hang }
            });
            
            if (!group) {
                return res.status(400).json({
                    success: false,
                    message: "Nhóm khách hàng không tồn tại"
                });
            }
        }
        
        if (nguon_tiep_can) {
            const source = await prisma.opportunity_source.findUnique({
                where: { ma_nguon: nguon_tiep_can }
            });
            
            if (!source) {
                return res.status(400).json({
                    success: false,
                    message: "Nguồn tiếp cận không tồn tại"
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_khach_hang !== undefined) updateData.ten_khach_hang = ten_khach_hang;
        if (nguoi_phu_trach !== undefined) updateData.nguoi_phu_trach = nguoi_phu_trach;
        if (hanh_dong_tiep_theo !== undefined) updateData.hanh_dong_tiep_theo = hanh_dong_tiep_theo;
        if (ngay_lien_lac_tiep_theo !== undefined) updateData.ngay_lien_lac_tiep_theo = ngay_lien_lac_tiep_theo ? new Date(ngay_lien_lac_tiep_theo) : null;
        if (so_lan_da_lien_lac !== undefined) updateData.so_lan_da_lien_lac = parseInt(so_lan_da_lien_lac);
        if (muc_dich !== undefined) updateData.muc_dich = muc_dich;
        if (nhom_khach_hang !== undefined) updateData.nhom_khach_hang = nhom_khach_hang;
        if (nguon_tiep_can !== undefined) updateData.nguon_tiep_can = nguon_tiep_can;
        if (tinh_trang !== undefined) updateData.tinh_trang = tinh_trang;
        if (email !== undefined) updateData.email = email;
        if (so_dien_thoai !== undefined) updateData.so_dien_thoai = so_dien_thoai;
        if (website !== undefined) updateData.website = website;
        if (dia_chi_cu_the !== undefined) updateData.dia_chi_cu_the = dia_chi_cu_the;
        if (tinh_thanh !== undefined) updateData.tinh_thanh = tinh_thanh;
        if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;
        
        // Only update if we have data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu để cập nhật"
            });
        }
        
        // Update potential customer
        const potentialCustomer = await prisma.potential_customer.update({
            where: { ma_khach_hang_tiem_nang: id },
            data: updateData,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                customer_group: {
                    select: {
                        nhom_khach_hang: true
                    }
                },
                opportunity_source: {
                    select: {
                        nguon: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật khách hàng tiềm năng thành công",
            data: potentialCustomer
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật khách hàng tiềm năng",
            error: error.message
        });
    }
};

// Delete potential customer
export const deletePotentialCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if potential customer exists
        const potentialCustomer = await prisma.potential_customer.findUnique({
            where: { ma_khach_hang_tiem_nang: id }
        });
        
        if (!potentialCustomer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng tiềm năng"
            });
        }
        
        // Delete potential customer
        await prisma.potential_customer.delete({
            where: { ma_khach_hang_tiem_nang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa khách hàng tiềm năng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa khách hàng tiềm năng",
            error: error.message
        });
    }
};

// Get potential customers by group
export const getPotentialCustomersByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const potentialCustomers = await prisma.potential_customer.findMany({
            where: { nhom_khach_hang: groupId },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                },
                opportunity_source: {
                    select: {
                        ma_nguon: true,
                        nguon: true
                    }
                }
            },
            orderBy: { ten_khach_hang: 'asc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách khách hàng tiềm năng thuộc nhóm ${groupId} thành công`,
            data: potentialCustomers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách khách hàng tiềm năng theo nhóm",
            error: error.message
        });
    }
};

// Get potential customers by source
export const getPotentialCustomersBySource = async (req, res) => {
    try {
        const { sourceId } = req.params;
        
        const potentialCustomers = await prisma.potential_customer.findMany({
            where: { nguon_tiep_can: sourceId },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                },
                customer_group: {
                    select: {
                        ma_nhom_khach_hang: true,
                        nhom_khach_hang: true
                    }
                }
            },
            orderBy: { ten_khach_hang: 'asc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách khách hàng tiềm năng từ nguồn ${sourceId} thành công`,
            data: potentialCustomers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách khách hàng tiềm năng theo nguồn",
            error: error.message
        });
    }
};

// Get potential customers by manager
export const getPotentialCustomersByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        
        const potentialCustomers = await prisma.potential_customer.findMany({
            where: { nguoi_phu_trach: managerId },
            include: {
                customer_group: {
                    select: {
                        ma_nhom_khach_hang: true,
                        nhom_khach_hang: true
                    }
                },
                opportunity_source: {
                    select: {
                        ma_nguon: true,
                        nguon: true
                    }
                }
            },
            orderBy: { ten_khach_hang: 'asc' }
        });
        
        res.json({
            success: true,
            message: `Lấy danh sách khách hàng tiềm năng được phụ trách bởi ${managerId} thành công`,
            data: potentialCustomers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách khách hàng tiềm năng theo người phụ trách",
            error: error.message
        });
    }
};

// Get potential customer statistics
export const getPotentialCustomerStats = async (req, res) => {
    try {
        const totalCount = await prisma.potential_customer.count();
        
        const statusCounts = await prisma.$queryRaw`
            SELECT "tinh_trang", COUNT(*) as "count"
            FROM "potential_customer"
            WHERE "tinh_trang" IS NOT NULL
            GROUP BY "tinh_trang"
            ORDER BY "count" DESC
        `;
        
        const groupCounts = await prisma.$queryRaw`
            SELECT cg."nhom_khach_hang", COUNT(pc.*) as "count"
            FROM "potential_customer" pc
            JOIN "customer_group" cg ON pc."nhom_khach_hang" = cg."ma_nhom_khach_hang"
            WHERE pc."nhom_khach_hang" IS NOT NULL
            GROUP BY cg."nhom_khach_hang"
            ORDER BY "count" DESC
            LIMIT 5
        `;
        
        const sourceCounts = await prisma.$queryRaw`
            SELECT os."nguon", COUNT(pc.*) as "count"
            FROM "potential_customer" pc
            JOIN "opportunity_source" os ON pc."nguon_tiep_can" = os."ma_nguon"
            WHERE pc."nguon_tiep_can" IS NOT NULL
            GROUP BY os."nguon"
            ORDER BY "count" DESC
            LIMIT 5
        `;
        
        const recentPotentialCustomers = await prisma.potential_customer.findMany({
            orderBy: {
                ngay_them_vao: 'desc'
            },
            take: 5,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                customer_group: {
                    select: {
                        nhom_khach_hang: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê khách hàng tiềm năng thành công",
            data: {
                totalCount,
                byStatus: statusCounts,
                byGroup: groupCounts,
                bySource: sourceCounts,
                recentPotentialCustomers
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê khách hàng tiềm năng",
            error: error.message
        });
    }
};