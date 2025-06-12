import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all contracts
export const getAllContracts = async (req, res) => {
    try {
        const contracts = await prisma.contracts.findMany({
            include: {
                contract_type: {
                    select: {
                        ma_loai_hop_dong: true,
                        ten_loai_hop_dong: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                _count: {
                    select: {
                        order_details: true,
                        stock_in: true
                    }
                }
            },
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách hợp đồng thành công",
            data: contracts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách hợp đồng",
            error: error.message
        });
    }
};

// Get contract by ID (Option 1 - using query parameters)
export const getContractById = async (req, res) => {
    try {
        let id = req.query.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID hợp đồng là bắt buộc"
            });
        }
        
        console.log(`Original ID received for lookup: "${id}"`);
        
        // Try with the exact ID as provided first
        let contract = await prisma.contracts.findUnique({
            where: { so_hop_dong: id },
            include: {
                contract_type: {
                    select: {
                        ma_loai_hop_dong: true,
                        ten_loai_hop_dong: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true,
                        so_dien_thoai: true
                    }
                },
                order_details: {
                    include: {
                        products: {
                            select: {
                                ma_hang: true,
                                ten_hang: true,
                                gia_thuc: true
                            }
                        },
                        customers: {
                            select: {
                                ma_khach_hang: true,
                                ten_khach_hang: true
                            }
                        }
                    }
                },
                stock_in: {
                    include: {
                        products: {
                            select: {
                                ma_hang: true,
                                ten_hang: true
                            }
                        },
                        suppliers: {
                            select: {
                                ma_nha_cung_cap: true,
                                ten_nha_cung_cap: true
                            }
                        }
                    }
                }
            }
        });
        
        // If not found, try with trimmed ID
        if (!contract) {
            const trimmedId = id.trim();
            console.log(`Trying with trimmed ID: "${trimmedId}"`);
            
            contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: trimmedId },
                include: {
                    // Same includes as above
                    contract_type: {
                        select: {
                            ma_loai_hop_dong: true,
                            ten_loai_hop_dong: true
                        }
                    },
                    accounts: {
                        select: {
                            ma_nguoi_dung: true,
                            ho_va_ten: true,
                            email: true,
                            so_dien_thoai: true
                        }
                    },
                    order_details: {
                        include: {
                            products: {
                                select: {
                                    ma_hang: true,
                                    ten_hang: true,
                                    gia_thuc: true
                                }
                            },
                            customers: {
                                select: {
                                    ma_khach_hang: true,
                                    ten_khach_hang: true
                                }
                            }
                        }
                    },
                    stock_in: {
                        include: {
                            products: {
                                select: {
                                    ma_hang: true,
                                    ten_hang: true
                                }
                            },
                            suppliers: {
                                select: {
                                    ma_nha_cung_cap: true,
                                    ten_nha_cung_cap: true
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // If still not found, try with a space added at the beginning
        if (!contract) {
            const spacedId = ` ${id.trim()}`;
            console.log(`Trying with space added: "${spacedId}"`);
            
            contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: spacedId },
                include: {
                    // Same includes as above
                    contract_type: {
                        select: {
                            ma_loai_hop_dong: true,
                            ten_loai_hop_dong: true
                        }
                    },
                    accounts: {
                        select: {
                            ma_nguoi_dung: true,
                            ho_va_ten: true,
                            email: true,
                            so_dien_thoai: true
                        }
                    },
                    order_details: {
                        include: {
                            products: {
                                select: {
                                    ma_hang: true,
                                    ten_hang: true,
                                    gia_thuc: true
                                }
                            },
                            customers: {
                                select: {
                                    ma_khach_hang: true,
                                    ten_khach_hang: true
                                }
                            }
                        }
                    },
                    stock_in: {
                        include: {
                            products: {
                                select: {
                                    ma_hang: true,
                                    ten_hang: true
                                }
                            },
                            suppliers: {
                                select: {
                                    ma_nha_cung_cap: true,
                                    ten_nha_cung_cap: true
                                }
                            }
                        }
                    }
                }
            });
        }
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hợp đồng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin hợp đồng thành công",
            data: contract
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin hợp đồng",
            error: error.message
        });
    }
};
// Create new contract with proper stt handling
export const createContract = async (req, res) => {
    try {
        const { 
            so_hop_dong, 
            loai_hop_dong, 
            ngay_ky_hop_dong, 
            ngay_bat_dau, 
            ngay_ket_thuc, 
            gia_tri_hop_dong, 
            trang_thai_hop_dong, 
            doi_tac_lien_quan, 
            dieu_khoan_thanh_toan, 
            tep_dinh_kem, 
            vi_tri_luu_tru, 
            nguoi_tao, 
            ghi_chu 
        } = req.body;
        
        // Validate required fields
        if (!so_hop_dong) {
            return res.status(400).json({
                success: false,
                message: "Số hợp đồng là bắt buộc"
            });
        }
        
        // Check if contract ID already exists
        const existingContract = await prisma.contracts.findUnique({
            where: { so_hop_dong }
        });
        
        if (existingContract) {
            return res.status(400).json({
                success: false,
                message: `Số hợp đồng ${so_hop_dong} đã tồn tại`
            });
        }
        
        // Check if contract type exists if provided
        if (loai_hop_dong) {
            const contractType = await prisma.contract_type.findUnique({
                where: { ma_loai_hop_dong: loai_hop_dong }
            });
            
            if (!contractType) {
                return res.status(400).json({
                    success: false,
                    message: `Loại hợp đồng ${loai_hop_dong} không tồn tại`
                });
            }
        }
        
        // Check if creator user exists if provided
        if (nguoi_tao) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_tao }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người tạo với mã ${nguoi_tao} không tồn tại`
                });
            }
        }
        
        // Get the highest stt and increment by 1
        const maxStt = await prisma.contracts.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxStt._max.stt || 0) + 1;
        
        // Create contract with auto-incremented stt
        const contract = await prisma.contracts.create({
            data: {
                stt: nextStt,
                so_hop_dong,
                loai_hop_dong,
                ngay_ky_hop_dong: ngay_ky_hop_dong ? new Date(ngay_ky_hop_dong) : null,
                ngay_bat_dau: ngay_bat_dau ? new Date(ngay_bat_dau) : null,
                ngay_ket_thuc: ngay_ket_thuc ? new Date(ngay_ket_thuc) : null,
                gia_tri_hop_dong: gia_tri_hop_dong || 0,
                trang_thai_hop_dong,
                doi_tac_lien_quan,
                dieu_khoan_thanh_toan,
                tep_dinh_kem,
                vi_tri_luu_tru,
                nguoi_tao,
                ghi_chu
            },
            include: {
                contract_type: {
                    select: {
                        ten_loai_hop_dong: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo hợp đồng thành công",
            data: contract
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo hợp đồng",
            error: error.message
        });
    }
};
// Update contract with enhanced debugging and edge case handling
export const updateContract = async (req, res) => {
    try {
        let id = req.query.id;
        const { 
            loai_hop_dong, 
            ngay_ky_hop_dong, 
            ngay_bat_dau, 
            ngay_ket_thuc, 
            gia_tri_hop_dong, 
            trang_thai_hop_dong, 
            doi_tac_lien_quan, 
            dieu_khoan_thanh_toan, 
            tep_dinh_kem, 
            vi_tri_luu_tru, 
            nguoi_tao, 
            ghi_chu 
        } = req.body;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID hợp đồng là bắt buộc"
            });
        }
        
        console.log(`[UPDATE] Original ID received: "${id}"`);
        
        // Get all contract IDs for debugging
        const allContracts = await prisma.contracts.findMany({
            select: {
                so_hop_dong: true
            }
        });
        
        console.log("All available contract IDs in database:");
        allContracts.forEach(c => console.log(`- "${c.so_hop_dong}"`));
        
        // Look for similar contract IDs to help with troubleshooting
        const similarContracts = allContracts.filter(c => 
            c.so_hop_dong.includes(id.trim()) || 
            id.trim().includes(c.so_hop_dong.trim())
        );
        
        if (similarContracts.length > 0) {
            console.log("Found similar contract IDs:");
            similarContracts.forEach(c => console.log(`- "${c.so_hop_dong}"`));
        }
        
        // Try with the exact ID as provided
        let existingContract = await prisma.contracts.findUnique({
            where: { so_hop_dong: id }
        });
        console.log(`Exact match search result: ${existingContract ? "Found" : "Not found"}`);
        
        let actualId = id;
        
        // If not found, try with trimmed ID
        if (!existingContract) {
            const trimmedId = id.trim();
            console.log(`Trying with trimmed ID: "${trimmedId}"`);
            
            existingContract = await prisma.contracts.findUnique({
                where: { so_hop_dong: trimmedId }
            });
            
            if (existingContract) {
                actualId = trimmedId;
                console.log(`Found with trimmed ID: "${trimmedId}"`);
            } else {
                console.log(`Not found with trimmed ID`);
            }
        }
        
        // If still not found, try with a space added at the beginning
        if (!existingContract) {
            const spacedId = ` ${id.trim()}`;
            console.log(`Trying with space added: "${spacedId}"`);
            
            existingContract = await prisma.contracts.findUnique({
                where: { so_hop_dong: spacedId }
            });
            
            if (existingContract) {
                actualId = spacedId;
                console.log(`Found with spaced ID: "${spacedId}"`);
            } else {
                console.log(`Not found with spaced ID`);
            }
        }
        
        // If still not found, try with similar contract IDs found in the database
        if (!existingContract && similarContracts.length > 0) {
            console.log(`Trying with similar contract IDs found in database`);
            
            for (const similarContract of similarContracts) {
                console.log(`Trying similar ID: "${similarContract.so_hop_dong}"`);
                
                existingContract = await prisma.contracts.findUnique({
                    where: { so_hop_dong: similarContract.so_hop_dong }
                });
                
                if (existingContract) {
                    actualId = similarContract.so_hop_dong;
                    console.log(`Found contract with similar ID: "${similarContract.so_hop_dong}"`);
                    break;
                }
            }
        }
        
        if (!existingContract) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hợp đồng",
                debug: {
                    queriedId: id,
                    similarIds: similarContracts.map(c => c.so_hop_dong)
                }
            });
        }
        
        console.log(`Found contract to update: "${actualId}"`);
        
        // Validation for contract type
        if (loai_hop_dong) {
            const contractType = await prisma.contract_type.findUnique({
                where: { ma_loai_hop_dong: loai_hop_dong }
            });
            
            if (!contractType) {
                return res.status(400).json({
                    success: false,
                    message: `Loại hợp đồng ${loai_hop_dong} không tồn tại`
                });
            }
        }
        
        // Validation for user
        if (nguoi_tao) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_tao }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người tạo với mã ${nguoi_tao} không tồn tại`
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (loai_hop_dong !== undefined) updateData.loai_hop_dong = loai_hop_dong;
        if (ngay_ky_hop_dong !== undefined) updateData.ngay_ky_hop_dong = ngay_ky_hop_dong ? new Date(ngay_ky_hop_dong) : null;
        if (ngay_bat_dau !== undefined) updateData.ngay_bat_dau = ngay_bat_dau ? new Date(ngay_bat_dau) : null;
        if (ngay_ket_thuc !== undefined) updateData.ngay_ket_thuc = ngay_ket_thuc ? new Date(ngay_ket_thuc) : null;
        if (gia_tri_hop_dong !== undefined) updateData.gia_tri_hop_dong = gia_tri_hop_dong;
        if (trang_thai_hop_dong !== undefined) updateData.trang_thai_hop_dong = trang_thai_hop_dong;
        if (doi_tac_lien_quan !== undefined) updateData.doi_tac_lien_quan = doi_tac_lien_quan;
        if (dieu_khoan_thanh_toan !== undefined) updateData.dieu_khoan_thanh_toan = dieu_khoan_thanh_toan;
        if (tep_dinh_kem !== undefined) updateData.tep_dinh_kem = tep_dinh_kem;
        if (vi_tri_luu_tru !== undefined) updateData.vi_tri_luu_tru = vi_tri_luu_tru;
        if (nguoi_tao !== undefined) updateData.nguoi_tao = nguoi_tao;
        if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;
        
        console.log(`Updating contract with ID: "${actualId}" and data:`, updateData);
        
        // Update contract using the actual ID that was found
        const contract = await prisma.contracts.update({
            where: { so_hop_dong: actualId },
            data: updateData,
            include: {
                contract_type: {
                    select: {
                        ten_loai_hop_dong: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật hợp đồng thành công",
            data: contract
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật hợp đồng",
            error: error.message
        });
    }
};
// Delete contract with enhanced debugging and edge case handling
export const deleteContract = async (req, res) => {
    try {
        let id = req.query.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID hợp đồng là bắt buộc"
            });
        }
        
        console.log(`[DELETE] Original ID received: "${id}"`);
        
        // Get all contract IDs for debugging
        const allContracts = await prisma.contracts.findMany({
            select: {
                so_hop_dong: true
            }
        });
        
        console.log("All available contract IDs in database:");
        allContracts.forEach(c => console.log(`- "${c.so_hop_dong}"`));
        
        // Look for similar contract IDs to help with troubleshooting
        const similarContracts = allContracts.filter(c => 
            c.so_hop_dong.includes(id.trim()) || 
            id.trim().includes(c.so_hop_dong.trim())
        );
        
        if (similarContracts.length > 0) {
            console.log("Found similar contract IDs:");
            similarContracts.forEach(c => console.log(`- "${c.so_hop_dong}"`));
        }
        
        // First try with the exact ID as provided
        let contract = await prisma.contracts.findUnique({
            where: { so_hop_dong: id },
            include: {
                order_details: true,
                stock_in: true
            }
        });
        console.log(`Exact match search result: ${contract ? "Found" : "Not found"}`);
        
        // If not found, try with trimmed ID
        if (!contract) {
            const trimmedId = id.trim();
            console.log(`Trying with trimmed ID: "${trimmedId}"`);
            
            contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: trimmedId },
                include: {
                    order_details: true,
                    stock_in: true
                }
            });
            console.log(`Trimmed ID search result: ${contract ? "Found" : "Not found"}`);
        }
        
        // If still not found, try with a space added at the beginning
        if (!contract) {
            const spacedId = ` ${id.trim()}`;
            console.log(`Trying with space added: "${spacedId}"`);
            
            contract = await prisma.contracts.findUnique({
                where: { so_hop_dong: spacedId },
                include: {
                    order_details: true,
                    stock_in: true
                }
            });
            console.log(`Spaced ID search result: ${contract ? "Found" : "Not found"}`);
        }
        
        // If still not found, try with potential encoding/decoding differences
        if (!contract && similarContracts.length > 0) {
            console.log(`Trying with similar contract IDs found in database`);
            
            // Try each similar contract ID
            for (const similarContract of similarContracts) {
                console.log(`Trying similar ID: "${similarContract.so_hop_dong}"`);
                
                contract = await prisma.contracts.findUnique({
                    where: { so_hop_dong: similarContract.so_hop_dong },
                    include: {
                        order_details: true,
                        stock_in: true
                    }
                });
                
                if (contract) {
                    console.log(`Found contract with similar ID: "${similarContract.so_hop_dong}"`);
                    break;
                }
            }
        }
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hợp đồng",
                debug: {
                    queriedId: id,
                    similarIds: similarContracts.map(c => c.so_hop_dong)
                }
            });
        }
        
        console.log(`Found contract to delete: "${contract.so_hop_dong}"`);
        
        // Check if there are related records
        if (contract.order_details.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa hợp đồng vì đang có đơn hàng liên quan",
                count: contract.order_details.length
            });
        }
        
        if (contract.stock_in.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa hợp đồng vì đang có dữ liệu nhập kho liên quan",
                count: contract.stock_in.length
            });
        }
        
        // Delete contract using the ID from the contract we found
        console.log(`Deleting contract with ID: "${contract.so_hop_dong}"`);
        await prisma.contracts.delete({
            where: { so_hop_dong: contract.so_hop_dong }
        });
        
        res.json({
            success: true,
            message: "Xóa hợp đồng thành công",
            deletedId: contract.so_hop_dong
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa hợp đồng",
            error: error.message
        });
    }
};
// Get contract statistics
export const getContractStats = async (req, res) => {
    try {
        // Get count of contracts
        const contractCount = await prisma.contracts.count();
        
        // Get total contract value
        const totalValue = await prisma.contracts.aggregate({
            _sum: {
                gia_tri_hop_dong: true
            }
        });
        
        // Get contracts by status
        const contractsByStatus = await prisma.contracts.groupBy({
            by: ['trang_thai_hop_dong'],
            _count: {
                so_hop_dong: true
            },
            where: {
                trang_thai_hop_dong: {
                    not: null
                }
            }
        });
        
        // Get contracts by type
        const contractsByType = await prisma.contracts.groupBy({
            by: ['loai_hop_dong'],
            _count: {
                so_hop_dong: true
            },
            _sum: {
                gia_tri_hop_dong: true
            },
            where: {
                loai_hop_dong: {
                    not: null
                }
            }
        });
        
        // Get contracts expiring soon (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const expiringContracts = await prisma.contracts.findMany({
            where: {
                ngay_ket_thuc: {
                    gte: new Date(),
                    lte: thirtyDaysFromNow
                }
            },
            include: {
                contract_type: {
                    select: {
                        ten_loai_hop_dong: true
                    }
                }
            },
            orderBy: {
                ngay_ket_thuc: 'asc'
            },
            take: 5
        });
        
        // Get recently created contracts
        const recentContracts = await prisma.contracts.findMany({
            orderBy: {
                ngay_ky_hop_dong: 'desc'
            },
            include: {
                contract_type: {
                    select: {
                        ten_loai_hop_dong: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            },
            take: 5
        });
        
        res.json({
            success: true,
            message: "Lấy thống kê hợp đồng thành công",
            data: {
                totalContracts: contractCount,
                totalValue: totalValue._sum.gia_tri_hop_dong || 0,
                contractsByStatus,
                contractsByType: await Promise.all(contractsByType.map(async (type) => {
                    if (type.loai_hop_dong) {
                        const contractType = await prisma.contract_type.findUnique({
                            where: { ma_loai_hop_dong: type.loai_hop_dong },
                            select: { ten_loai_hop_dong: true }
                        });
                        return {
                            loai_hop_dong: type.loai_hop_dong,
                            ten_loai_hop_dong: contractType?.ten_loai_hop_dong || 'Unknown',
                            count: type._count.so_hop_dong,
                            totalValue: type._sum.gia_tri_hop_dong || 0
                        };
                    }
                    return {
                        loai_hop_dong: type.loai_hop_dong,
                        ten_loai_hop_dong: 'Unknown',
                        count: type._count.so_hop_dong,
                        totalValue: type._sum.gia_tri_hop_dong || 0
                    };
                })),
                expiringContracts,
                recentContracts
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê hợp đồng",
            error: error.message
        });
    }
};