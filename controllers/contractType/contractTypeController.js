import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all contract types
export const getAllContractTypes = async (req, res) => {
    try {
        const contractTypes = await prisma.contract_type.findMany({
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                _count: {
                    select: {
                        contracts: true
                    }
                }
            },
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách loại hợp đồng thành công",
            data: contractTypes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách loại hợp đồng",
            error: error.message
        });
    }
};

// Get contract type by ID
export const getContractTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const contractType = await prisma.contract_type.findUnique({
            where: { ma_loai_hop_dong: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                contracts: {
                    take: 10,
                    orderBy: {
                        ngay_ky_hop_dong: 'desc'
                    }
                },
                _count: {
                    select: {
                        contracts: true
                    }
                }
            }
        });
        
        if (!contractType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại hợp đồng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin loại hợp đồng thành công",
            data: contractType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin loại hợp đồng",
            error: error.message
        });
    }
};

// Create new contract type with auto-incrementing stt
export const createContractType = async (req, res) => {
    try {
        const { 
            ma_loai_hop_dong, 
            ten_loai_hop_dong, 
            tinh_trang, 
            nguoi_cap_nhat, 
            mo_ta 
        } = req.body;
        
        // Validate required fields
        if (!ma_loai_hop_dong || !ten_loai_hop_dong) {
            return res.status(400).json({
                success: false,
                message: "Mã loại hợp đồng và tên loại hợp đồng là bắt buộc"
            });
        }
        
        // Check if contract type ID already exists
        const existingContractType = await prisma.contract_type.findUnique({
            where: { ma_loai_hop_dong }
        });
        
        if (existingContractType) {
            return res.status(400).json({
                success: false,
                message: `Mã loại hợp đồng ${ma_loai_hop_dong} đã tồn tại`
            });
        }
        
        // Check if user exists
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người dùng với mã ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Get the highest stt and increment by 1
        const maxStt = await prisma.contract_type.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxStt._max.stt || 0) + 1;
        
        // Create contract type with auto-incremented stt
        const contractType = await prisma.contract_type.create({
            data: {
                stt: nextStt,
                ma_loai_hop_dong,
                ten_loai_hop_dong,
                tinh_trang,
                nguoi_cap_nhat,
                ngay_cap_nhat: new Date(),
                mo_ta
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo loại hợp đồng thành công",
            data: contractType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo loại hợp đồng",
            error: error.message
        });
    }
};
// Update contract type
export const updateContractType = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_loai_hop_dong, 
            tinh_trang, 
            nguoi_cap_nhat, 
            mo_ta 
        } = req.body;
        
        // Check if contract type exists
        const existingContractType = await prisma.contract_type.findUnique({
            where: { ma_loai_hop_dong: id }
        });
        
        if (!existingContractType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại hợp đồng"
            });
        }
        
        // Check if user exists if provided
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người dùng với mã ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_loai_hop_dong !== undefined) updateData.ten_loai_hop_dong = ten_loai_hop_dong;
        if (tinh_trang !== undefined) updateData.tinh_trang = tinh_trang;
        if (nguoi_cap_nhat !== undefined) updateData.nguoi_cap_nhat = nguoi_cap_nhat;
        if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
        
        // Always update the timestamp
        updateData.ngay_cap_nhat = new Date();
        
        // Update contract type
        const contractType = await prisma.contract_type.update({
            where: { ma_loai_hop_dong: id },
            data: updateData,
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật loại hợp đồng thành công",
            data: contractType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật loại hợp đồng",
            error: error.message
        });
    }
};

// Delete contract type
export const deleteContractType = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if contract type exists
        const contractType = await prisma.contract_type.findUnique({
            where: { ma_loai_hop_dong: id },
            include: {
                contracts: true
            }
        });
        
        if (!contractType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại hợp đồng"
            });
        }
        
        // Check if there are contracts using this type
        if (contractType.contracts.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa loại hợp đồng vì đang được sử dụng bởi một số hợp đồng",
                count: contractType.contracts.length
            });
        }
        
        // Delete contract type
        await prisma.contract_type.delete({
            where: { ma_loai_hop_dong: id }
        });
        
        res.json({
            success: true,
            message: "Xóa loại hợp đồng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa loại hợp đồng",
            error: error.message
        });
    }
};

// Get contract type statistics
export const getContractTypeStats = async (req, res) => {
    try {
        // Get count of contract types
        const contractTypeCount = await prisma.contract_type.count();
        
        // Get contract types by status
        const contractTypesByStatus = await prisma.contract_type.groupBy({
            by: ['tinh_trang'],
            _count: {
                ma_loai_hop_dong: true
            },
            where: {
                tinh_trang: {
                    not: null
                }
            }
        });
        
        // Get contract types with most contracts
        const contractTypesWithMostContracts = await prisma.contract_type.findMany({
            take: 5,
            include: {
                _count: {
                    select: {
                        contracts: true
                    }
                }
            },
            orderBy: {
                contracts: {
                    _count: 'desc'
                }
            }
        });
        
        // Get recently updated contract types
        const recentContractTypes = await prisma.contract_type.findMany({
            take: 5,
            orderBy: {
                ngay_cap_nhat: 'desc'
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê loại hợp đồng thành công",
            data: {
                totalContractTypes: contractTypeCount,
                contractTypesByStatus,
                topContractTypes: contractTypesWithMostContracts.map(ct => ({
                    ma_loai_hop_dong: ct.ma_loai_hop_dong,
                    ten_loai_hop_dong: ct.ten_loai_hop_dong,
                    contractCount: ct._count.contracts
                })),
                recentContractTypes
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê loại hợp đồng",
            error: error.message
        });
    }
};