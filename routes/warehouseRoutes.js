import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

// Import Login controller
import { login } from '../controllers/Login/Login.controller.js';

// Import Bao Tri controllers
import { 
    getAllBaoTri, getBaoTriById, createBaoTri, updateBaoTri, deleteBaoTri 
} from '../controllers/getAllData/baoTriController.js';

// Import Product Type controllers
import {
    getAllProductTypes, getProductTypeById, createProductType, updateProductType, deleteProductType
} from '../controllers/productType/productTypeController.js';

// Update the import statement to include all required functions

import { 
    getAllProducts, 
    getProductById, 
    createProduct, 
    updateProductByCodeAndStt,
    deleteProduct,
    deleteProductByCodeAndDate,  // Add this function
    upload,                      // Add this function
    importProductsFromExcel,     // Add this function
    generateProductTemplate      // Add if needed
} from '../controllers/products/productController.js';
// Import Product Image controllers
import { 
    getAllProductImages, getProductImageById, createProductImage, updateProductImage, deleteProductImage
} from '../controllers/productImage/productImageController.js';

// Import Role controllers
import { 
    getAllRoles, getRoleById, createRole, updateRole, deleteRole 
} from '../controllers/Role/roleController.js';

// Import User controllers
import { 
    getAllUsers, getUserById, createUser, updateUser, deleteUser 
} from '../controllers/Users/userController.js';

// Import all required functions from supplier controller
import { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier,importSuppliersFromExcel,generateSupplierTemplate
} from '../controllers/supplier1/suppliers1Controller.js';

// Import Competitor controllers
import { 
    getAllCompetitors, getCompetitorById, createCompetitor, updateCompetitor, deleteCompetitor 
} from '../controllers/competitor/competitorController.js';

// Import Account controllers
import { 
    getAllAccounts, getAccountById, createAccount, updateAccount, deleteAccount, getAccountStats
} from '../controllers/account/accountController.js';

// Import Warehouse controllers
import {
    getAllWarehouses, getWarehouseById, createWarehouse, updateWarehouse, deleteWarehouse, getWarehouseStats, getWarehouseInventory
} from '../controllers/warehouse/warehouseController.js';

// Import Customer controllers
import {
    getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getCustomerStats, getCustomerInteractions
} from '../controllers/customers/customersController.js';

// Import Contract Type controllers
import {
    getAllContractTypes, getContractTypeById, createContractType, updateContractType, deleteContractType, getContractTypeStats
} from '../controllers/contractType/contractTypeController.js';

// Import Contract controllers
import {
    getAllContracts, getContractById, createContract, updateContract, deleteContract, getContractStats
} from '../controllers/contracts/contractController.js';

// Import Bill controllers
import {getAllBills,getBillById,createBill,updateBill,deleteBill,getBillWithOrderDetails,getBillWithStockIn,getBillStats
} from '../controllers/Bills/bill.controller.js';

// Import Stock-In controllers
import {getAllStockIn,getStockInById,createStockIn,updateStockIn,deleteStockIn,getStockInByProduct,getStockInByWarehouse,getStockInBySupplier,getStockInByBill, getStockInByContract,getStockInStats,upload as stockInUpload,
    importStockInFromExcel,
    generateStockInTemplate
} from '../controllers/stock-in/stockIn.controller.js';
const router = express.Router();

// Import Stock-Out controllers
import {getAllStockOut,getStockOutById,createStockOut,updateStockOut,deleteStockOut,getStockOutByProduct,getStockOutByWarehouse,getStockOutByCustomer,getStockOutByUser,getStockOutStats,upload as stockOutUpload,importStockOutFromExcel,generateStockOutTemplate
} from '../controllers/stock-Out/stockOut.controller.js';

// Import Order Details controllers
import {getAllOrderDetails,getOrderDetailById,createOrderDetail,updateOrderDetail,deleteOrderDetail, getOrderDetailsByCustomer,getOrderDetailsByContract,getOrderDetailsByProduct,getOrderDetailsByBill,getOrderDetailsByManager,getOrderDetailsStats,upload as orderDetailUpload,importOrderDetailsFromExcel,generateOrderDetailTemplate
} from '../controllers/order-Details/orderDetail.controller.js';


// For inventory controller
import { 
    getAllInventory,
    getInventoryById,
    getInventoryByProduct,
    getInventoryByWarehouse,
    createInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory,
    getInventoryStats,
    upload as inventoryUpload,
    importInventoryFromExcel,
    generateInventoryTemplate
} from '../controllers/inventory/inventory.controller.js';

// For inventory check controller
import {
    getAllInventoryChecks,
    getInventoryCheckById,
    createInventoryCheck,
    updateInventoryCheck,
    deleteInventoryCheck,
    getInventoryChecksByProduct,
    getInventoryChecksByWarehouse,
    getInventoryChecksByUser,
    getInventoryCheckStats,
    upload as inventoryCheckUpload,
    importInventoryChecksFromExcel,
    generateInventoryCheckTemplate
} from '../controllers/inventoryCheck/inventoryCheck.controller.js';
// Import Order controllers
import {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderDetails,
    getOrdersByUser,
    calculateOrderTotalValue,
    getOrderStats,
    upload as orderUpload,
    importOrdersFromExcel,
    generateOrderTemplate
} from '../controllers/Order/order.controller.js';


// Auth routes
router.post('/auth/login', login);

// Account routes
router.get('/accounts', getAllAccounts);
router.get('/accounts/stats/overview', getAccountStats);
router.get('/accounts/:id', getAccountById);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', authMiddleware, deleteAccount);

// Bao Tri routes
router.get('/bao-tri', getAllBaoTri);
router.get('/bao-tri/:id', getBaoTriById);
router.post('/bao-tri', createBaoTri);
router.put('/bao-tri/:id', updateBaoTri);
router.delete('/bao-tri/:id', deleteBaoTri);

// Product Type routes
router.get('/product-types', getAllProductTypes);
router.get('/product-types/stats/overview', getContractTypeStats);
router.get('/product-types/:id', getProductTypeById);
router.post('/product-types', createProductType);
router.put('/product-types/:id', updateProductType);
router.delete('/product-types/:id', deleteProductType);

// Product routes
router.get('/products', getAllProducts);
// Product import route - IMPORTANT: This specific route must come BEFORE the :id route
router.post('/products/import', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importProductsFromExcel(req, res);
    });
});
router.get('/products/:id', getProductById);
router.post('/products', createProduct);

router.put('/products/:code/:stt', updateProductByCodeAndStt);
router.delete('/products/:id', deleteProduct);
// New route with update date
router.delete('/products/:id/:updateDate', deleteProduct);
router.delete('/products/:code/:date', deleteProductByCodeAndDate);
// Add new route that supports update date parameter

router.put('/products/:code/:stt', updateProductByCodeAndStt);
// Product Image routes
router.get('/product-images', getAllProductImages);
router.get('/product-images/:id', getProductImageById);
router.post('/product-images', createProductImage);
router.put('/product-images/:id', updateProductImage);
router.delete('/product-images/:id', deleteProductImage);

// Role routes
router.get('/roles', getAllRoles);
router.get('/roles/:id', getRoleById);
router.post('/roles', authMiddleware, createRole);
router.put('/roles/:id', authMiddleware, updateRole);
router.delete('/roles/:id', authMiddleware, deleteRole);

// User routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', authMiddleware, createUser);
router.put('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);

// Supplier routes
router.get('/suppliers', getAllSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);
// Add these routes for Excel import and template features
router.get('/suppliers/template', generateSupplierTemplate);
router.post('/suppliers/import', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importSuppliersFromExcel(req, res);
    });
});



// Warehouse routes
router.get('/warehouses', getAllWarehouses);
router.get('/warehouses/stats/overview', getWarehouseStats);
router.get('/warehouses/:id', getWarehouseById);
router.get('/warehouses/:id/inventory', getWarehouseInventory);
router.post('/warehouses', createWarehouse);
router.put('/warehouses/:id', updateWarehouse);
router.delete('/warehouses/:id', deleteWarehouse);

// Customer routes
router.get('/customers', getAllCustomers);
router.get('/customers/stats/overview', getCustomerStats);
router.get('/customers/:id/interactions', getCustomerInteractions);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Contract Type routes
router.get('/contract-types', getAllContractTypes);
router.get('/contract-types/stats/overview', getContractTypeStats);
router.get('/contract-types/:id', getContractTypeById);
router.post('/contract-types', createContractType);
router.put('/contract-types/:id', updateContractType);
router.delete('/contract-types/:id', deleteContractType);

// Contract routes
router.get('/contracts', getAllContracts);
router.get('/contracts/stats/overview', getContractStats);
router.get('/contracts/detail', getContractById);
router.post('/contracts', createContract);
router.put('/contracts/update', updateContract);
router.delete('/contracts', deleteContract);

// Bill routes - add these to maintenanceRoutes.js
router.get('/bills', getAllBills);
router.get('/bills/stats/overview', getBillStats);
router.get('/bills/:id', getBillById);
router.get('/bills/:id/order-details', getBillWithOrderDetails);
router.get('/bills/:id/stock-in', getBillWithStockIn);
router.post('/bills', createBill);
router.put('/bills/:id', updateBill);
router.delete('/bills/:id', deleteBill);

// Stock-In routes
router.get('/stock-in', getAllStockIn);
router.get('/stock-in/stats/overview', getStockInStats);
router.get('/stock-in/product/:productId', getStockInByProduct);
router.get('/stock-in/warehouse/:warehouseId', getStockInByWarehouse);
router.get('/stock-in/supplier/:supplierId', getStockInBySupplier);
router.get('/stock-in/bill/:billId', getStockInByBill);
router.get('/stock-in/contract/:contractId', getStockInByContract);
router.get('/stock-in/template', generateStockInTemplate);
router.post('/stock-in/import', (req, res) => {
    stockInUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importStockInFromExcel(req, res);
    });
});
router.get('/stock-in/:id', getStockInById);
router.post('/stock-in', createStockIn);
router.put('/stock-in/:id', updateStockIn);
router.delete('/stock-in/:id', deleteStockIn);

// Stock-Out routes
router.get('/stock-out', getAllStockOut);
router.get('/stock-out/stats/overview', getStockOutStats);
router.get('/stock-out/product/:productId', getStockOutByProduct);
router.get('/stock-out/warehouse/:warehouseId', getStockOutByWarehouse);
router.get('/stock-out/customer/:customerId', getStockOutByCustomer);
router.get('/stock-out/user/:userId', getStockOutByUser);
router.get('/stock-out/template', generateStockOutTemplate);
router.post('/stock-out/import', (req, res) => {
    stockOutUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importStockOutFromExcel(req, res);
    });
});
router.get('/stock-out/:id', getStockOutById);
router.post('/stock-out', createStockOut);
router.put('/stock-out/:id', updateStockOut);
router.delete('/stock-out/:id', deleteStockOut);

// Order Details routes
router.get('/order-details', getAllOrderDetails);
router.get('/order-details/stats/overview', getOrderDetailsStats);
router.get('/order-details/customer/:customerId', getOrderDetailsByCustomer);
router.get('/order-details/contract/:contractId', getOrderDetailsByContract);
router.get('/order-details/product/:productId', getOrderDetailsByProduct);
router.get('/order-details/bill/:billId', getOrderDetailsByBill);
router.get('/order-details/manager/:managerId', getOrderDetailsByManager);
router.get('/order-details/template', generateOrderDetailTemplate);
router.post('/order-details/import', (req, res) => {
    orderDetailUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importOrderDetailsFromExcel(req, res);
    });
});
router.get('/order-details/:id', getOrderDetailById);
router.post('/order-details', createOrderDetail);
router.put('/order-details/:id', updateOrderDetail);
router.delete('/order-details/:id', deleteOrderDetail);

// Inventory routes
router.get('/inventory', getAllInventory);
router.get('/inventory/stats/overview', getInventoryStats);
router.get('/inventory/low-stock', getLowStockInventory);
router.get('/inventory/product/:productId', getInventoryByProduct);
router.get('/inventory/warehouse/:warehouseId', getInventoryByWarehouse);
router.get('/inventory/template', generateInventoryTemplate);
router.post('/inventory/import', (req, res) => {
    inventoryUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importInventoryFromExcel(req, res);
    });
});
router.get('/inventory/:id', getInventoryById);
router.post('/inventory', createInventory);
router.put('/inventory/:id', updateInventory);
router.delete('/inventory/:id', deleteInventory);

// Inventory Check routes
router.get('/inventory-checks', getAllInventoryChecks);
router.get('/inventory-checks/stats/overview', getInventoryCheckStats);
router.get('/inventory-checks/product/:productId', getInventoryChecksByProduct);
router.get('/inventory-checks/warehouse/:warehouseId', getInventoryChecksByWarehouse);
router.get('/inventory-checks/user/:userId', getInventoryChecksByUser);
router.get('/inventory-checks/template', generateInventoryCheckTemplate);
router.post('/inventory-checks/import', (req, res) => {
    inventoryCheckUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importInventoryChecksFromExcel(req, res);
    });
});
router.get('/inventory-checks/:id', getInventoryCheckById);
router.post('/inventory-checks', createInventoryCheck);
router.put('/inventory-checks/:id', updateInventoryCheck);
router.delete('/inventory-checks/:id', deleteInventoryCheck);
// Order routes
router.get('/orders', getAllOrders);
router.get('/orders/stats/overview', getOrderStats);
router.get('/orders/user/:userId', getOrdersByUser);
router.get('/orders/template', generateOrderTemplate);
router.post('/orders/import', (req, res) => {
    orderUpload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        importOrdersFromExcel(req, res);
    });
});
router.get('/orders/:id', getOrderById);
router.get('/orders/:id/details', getOrderDetails);
router.post('/orders/:id/calculate', calculateOrderTotalValue);
router.post('/orders', createOrder);
router.put('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);
// Add this route with the other supplier routes
router.get('/suppliers/template', generateSupplierTemplate);


export default router;