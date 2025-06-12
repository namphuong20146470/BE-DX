import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

// Import Competitor controllers
import { 
    getAllCompetitors, getCompetitorById, createCompetitor, updateCompetitor, deleteCompetitor 
} from '../controllers/competitor/competitorController.js';

// Import Opportunity Source controllers
import {
    getAllOpportunitySources,
    getOpportunitySourceById,
    createOpportunitySource,
    updateOpportunitySource,
    deleteOpportunitySource,
    getOpportunitySourceStats
} from '../controllers/opportunitySource/opportunitySource.js';

// Import Customer Group controllers
import {
    getAllCustomerGroups,
    getCustomerGroupById,
    createCustomerGroup,
    updateCustomerGroup,
    deleteCustomerGroup,
    getCustomerGroupStats
} from '../controllers/customerGroup/customerGroup.controller.js';

// Import Potential Customer controllers
import {
    getAllPotentialCustomers,
    getPotentialCustomerById,
    createPotentialCustomer,
    updatePotentialCustomer,
    deletePotentialCustomer,
    getPotentialCustomersByGroup,
    getPotentialCustomersBySource,
    getPotentialCustomersByManager,
    getPotentialCustomerStats
} from '../controllers/potentialCustomer/potentialCustomer.controller.js';

// Import Quotation Status controllers
import {
    getAllQuotationStatuses,
    getQuotationStatusById,
    createQuotationStatus,
    updateQuotationStatus,
    deleteQuotationStatus,
    getQuotationStatusStats
} from '../controllers/quotationStatus/quotationStatus.controller.js';

// Import Quotation Type controllers
import {
    getAllQuotationTypes,
    getQuotationTypeById,
    createQuotationType,
    updateQuotationType,
    deleteQuotationType,
    getQuotationTypeStats
} from '../controllers/quotationType/quotationType.controller.js';

// Import Quotation controllers
import {
    getAllQuotations,
    getQuotationById,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationsByStatus,
    getQuotationsByType,
    getQuotationsByManager,
    getQuotationStats
} from '../controllers/quotations/quotation.controller.js';

// Import Interaction Type controllers
import {
    getAllInteractionTypes,
    getInteractionTypeById,
    createInteractionType,
    updateInteractionType,
    deleteInteractionType,
    getInteractionTypeStats
} from '../controllers/interactionType/interactionType.controller.js';

// Import Customer Interaction controllers
import {
    getAllCustomerInteractions,
    getCustomerInteractionById,
    createCustomerInteraction,
    updateCustomerInteraction,
    deleteCustomerInteraction,
    getCustomerInteractionsByCustomer,
    getCustomerInteractionsByManager,
    getCustomerInteractionsByType,
    getCustomerInteractionStats
} from '../controllers/customerInteractions/customerInteractions.controller.js';

const router = express.Router();

// Competitor routes
router.get('/competitors', getAllCompetitors);
router.get('/competitors/:id', getCompetitorById);
router.post('/competitors', createCompetitor);
router.put('/competitors/:id', updateCompetitor);
router.delete('/competitors/:id', deleteCompetitor);

// Opportunity Source routes
router.get('/opportunity-sources', getAllOpportunitySources);
router.get('/opportunity-sources/stats/overview', getOpportunitySourceStats);
router.get('/opportunity-sources/:id', getOpportunitySourceById);
router.post('/opportunity-sources', createOpportunitySource);
router.put('/opportunity-sources/:id', updateOpportunitySource);
router.delete('/opportunity-sources/:id', deleteOpportunitySource);

// Customer Group routes
router.get('/customer-groups', getAllCustomerGroups);
router.get('/customer-groups/stats/overview', getCustomerGroupStats);
router.get('/customer-groups/:id', getCustomerGroupById);
router.post('/customer-groups', createCustomerGroup);
router.put('/customer-groups/:id', updateCustomerGroup);
router.delete('/customer-groups/:id', deleteCustomerGroup);

// Potential Customer routes
router.get('/potential-customers', getAllPotentialCustomers);
router.get('/potential-customers/stats/overview', getPotentialCustomerStats);
router.get('/potential-customers/group/:groupId', getPotentialCustomersByGroup);
router.get('/potential-customers/source/:sourceId', getPotentialCustomersBySource);
router.get('/potential-customers/manager/:managerId', getPotentialCustomersByManager);
router.get('/potential-customers/:id', getPotentialCustomerById);
router.post('/potential-customers', createPotentialCustomer);
router.put('/potential-customers/:id', updatePotentialCustomer);
router.delete('/potential-customers/:id', deletePotentialCustomer);

// Quotation Status routes
router.get('/quotation-statuses', getAllQuotationStatuses);
router.get('/quotation-statuses/stats/overview', getQuotationStatusStats);
router.get('/quotation-statuses/:id', getQuotationStatusById);
router.post('/quotation-statuses', createQuotationStatus);
router.put('/quotation-statuses/:id', updateQuotationStatus);
router.delete('/quotation-statuses/:id', deleteQuotationStatus);

// Quotation Type routes
router.get('/quotation-types', getAllQuotationTypes);
router.get('/quotation-types/stats/overview', getQuotationTypeStats);
router.get('/quotation-types/:id', getQuotationTypeById);
router.post('/quotation-types', createQuotationType);
router.put('/quotation-types/:id', updateQuotationType);
router.delete('/quotation-types/:id', deleteQuotationType);

// Quotation routes
router.get('/quotations', getAllQuotations);
router.get('/quotations/stats/overview', getQuotationStats);
router.get('/quotations/status/:statusId', getQuotationsByStatus);
router.get('/quotations/type/:typeId', getQuotationsByType);
router.get('/quotations/manager/:managerId', getQuotationsByManager);
router.get('/quotations/:id', getQuotationById);
router.post('/quotations', createQuotation);
router.put('/quotations/:id', updateQuotation);
router.delete('/quotations/:id', deleteQuotation);

// Interaction Type routes
router.get('/interaction-types', getAllInteractionTypes);
router.get('/interaction-types/stats/overview', getInteractionTypeStats);
router.get('/interaction-types/:id', getInteractionTypeById);
router.post('/interaction-types', createInteractionType);
router.put('/interaction-types/:id', updateInteractionType);
router.delete('/interaction-types/:id', deleteInteractionType);

// Customer Interaction routes
router.get('/customer-interactions', getAllCustomerInteractions);
router.get('/customer-interactions/stats/overview', getCustomerInteractionStats);
router.get('/customer-interactions/customer/:customerName', getCustomerInteractionsByCustomer);
router.get('/customer-interactions/manager/:managerId', getCustomerInteractionsByManager);
router.get('/customer-interactions/type/:typeId', getCustomerInteractionsByType);
router.get('/customer-interactions/:id', getCustomerInteractionById);
router.post('/customer-interactions', createCustomerInteraction);
router.put('/customer-interactions/:id', updateCustomerInteraction);
router.delete('/customer-interactions/:id', deleteCustomerInteraction);

export default router;