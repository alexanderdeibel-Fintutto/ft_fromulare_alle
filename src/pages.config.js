/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIChatDemo from './pages/AIChatDemo';
import AIFormBuilder from './pages/AIFormBuilder';
import AIRecommendations from './pages/AIRecommendations';
import AISettings from './pages/AISettings';
import AISystemPromptManager from './pages/AISystemPromptManager';
import AISystemPrompts from './pages/AISystemPrompts';
import AITestSuite from './pages/AITestSuite';
import AIUsageReports from './pages/AIUsageReports';
import APIDocumentation from './pages/APIDocumentation';
import APIGatewayDashboard from './pages/APIGatewayDashboard';
import APIGatewayManager from './pages/APIGatewayManager';
import APIKeyManagement from './pages/APIKeyManagement';
import APIManagement from './pages/APIManagement';
import APIReference from './pages/APIReference';
import Abmahnung from './pages/Abmahnung';
import AccessControlManager from './pages/AccessControlManager';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminBillingAnalytics from './pages/AdminBillingAnalytics';
import AdminBillingInsights from './pages/AdminBillingInsights';
import AdminBrandingStudio from './pages/AdminBrandingStudio';
import AdminDashboard from './pages/AdminDashboard';
import AdminDashboardAI from './pages/AdminDashboardAI';
import AdminDashboardMain from './pages/AdminDashboardMain';
import AdminGDPRManagement from './pages/AdminGDPRManagement';
import AdminInvoiceManagement from './pages/AdminInvoiceManagement';
import AdminShareManagement from './pages/AdminShareManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard';
import AdvancedSearch from './pages/AdvancedSearch';
import AmortisationsRechner from './pages/AmortisationsRechner';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AnalyticsDashboardStudio from './pages/AnalyticsDashboardStudio';
import AnlageV from './pages/AnlageV';
import AppMarketplace from './pages/AppMarketplace';
import AuditLogs from './pages/AuditLogs';
import AutoScalingController from './pages/AutoScalingController';
import BackupManagement from './pages/BackupManagement';
import BackupRecovery from './pages/BackupRecovery';
import BankExpose from './pages/BankExpose';
import Betriebskostenabrechnung from './pages/Betriebskostenabrechnung';
import BewertungsRechner from './pages/BewertungsRechner';
import Billing from './pages/Billing';
import BillingAnalyticsDashboard from './pages/BillingAnalyticsDashboard';
import BillingInvoices from './pages/BillingInvoices';
import BillingSuccess from './pages/BillingSuccess';
import BrandingManager from './pages/BrandingManager';
import BrandingStudio from './pages/BrandingStudio';
import BulkOperationsManager from './pages/BulkOperationsManager';
import CO2Calculator from './pages/CO2Calculator';
import CacheManagement from './pages/CacheManagement';
import CanaryDeploymentManager from './pages/CanaryDeploymentManager';
import CashflowRechner from './pages/CashflowRechner';
import ChargebackManagement from './pages/ChargebackManagement';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import ComplianceCenter from './pages/ComplianceCenter';
import ComplianceTracker from './pages/ComplianceTracker';
import ConfigurationCenter from './pages/ConfigurationCenter';
import ContainerOrchestration from './pages/ContainerOrchestration';
import ContentManager from './pages/ContentManager';
import ContentVersioning from './pages/ContentVersioning';
import ContractManagement from './pages/ContractManagement';
import CostAnalyzer from './pages/CostAnalyzer';
import CreatorDashboard from './pages/CreatorDashboard';
import CreditManagement from './pages/CreditManagement';
import CrossAppSync from './pages/CrossAppSync';
import CrossSellDemo from './pages/CrossSellDemo';
import CustomReporting from './pages/CustomReporting';
import CustomerIntelligence from './pages/CustomerIntelligence';
import CustomerSuccessDashboard from './pages/CustomerSuccessDashboard';
import Dashboard from './pages/Dashboard';
import DataExportCenter from './pages/DataExportCenter';
import DataMigration from './pages/DataMigration';
import DataPrivacy from './pages/DataPrivacy';
import DatabaseOptimizer from './pages/DatabaseOptimizer';
import DelinquencyManagement from './pages/DelinquencyManagement';
import DeploymentPipelineManager from './pages/DeploymentPipelineManager';
import DeveloperPortal from './pages/DeveloperPortal';
import DisasterRecovery from './pages/DisasterRecovery';
import DisputeManagement from './pages/DisputeManagement';
import DocuSignApp from './pages/DocuSignApp';
import DocumentIntelligence from './pages/DocumentIntelligence';
import DocumentOCRUpload from './pages/DocumentOCRUpload';
import DocumentSearch from './pages/DocumentSearch';
import DownloadApps from './pages/DownloadApps';
import DunningManagement from './pages/DunningManagement';
import Eigenbedarfskuendigung from './pages/Eigenbedarfskuendigung';
import EigenkapitalrentabilitaetRechner from './pages/EigenkapitalrentabilitaetRechner';
import EmailCampaignBuilder from './pages/EmailCampaignBuilder';
import EmailMarketing from './pages/EmailMarketing';
import EmailNotificationSettings from './pages/EmailNotificationSettings';
import EmailTemplates from './pages/EmailTemplates';
import Energieausweis from './pages/Energieausweis';
import EnterpriseSettings from './pages/EnterpriseSettings';
import ExportHistory from './pages/ExportHistory';
import FeatureFlagManager from './pages/FeatureFlagManager';
import Ferienwohnungsvertrag from './pages/Ferienwohnungsvertrag';
import FinAPISync from './pages/FinAPISync';
import FinalSummary from './pages/FinalSummary';
import FinancialReporting from './pages/FinancialReporting';
import FinanzierungsRechner from './pages/FinanzierungsRechner';
import FintuttoEcosystemHub from './pages/FintuttoEcosystemHub';
import FormDesigner from './pages/FormDesigner';
import FormulareIndex from './pages/FormulareIndex';
import FraudDetection from './pages/FraudDetection';
import Gewerbemietvertrag from './pages/Gewerbemietvertrag';
import GewerbemietvertragTemplate from './pages/GewerbemietvertragTemplate';
import GlobalSearch from './pages/GlobalSearch';
import HaerteffallEinwand from './pages/HaerteffallEinwand';
import HandlePayPalReturn from './pages/HandlePayPalReturn';
import Hausordnung from './pages/Hausordnung';
import HausordnungGenerator from './pages/HausordnungGenerator';
import Home from './pages/Home';
import ImmoScout24Sync from './pages/ImmoScout24Sync';
import ImprovedDashboard from './pages/ImprovedDashboard';
import IncidentManagement from './pages/IncidentManagement';
import IndexmietRechner from './pages/IndexmietRechner';
import IndexmieteAnpassung from './pages/IndexmieteAnpassung';
import Indexmietvertrag from './pages/Indexmietvertrag';
import InstandhaltungsRueckstellung from './pages/InstandhaltungsRueckstellung';
import IntegrationBuilder from './pages/IntegrationBuilder';
import IntegrationManager from './pages/IntegrationManager';
import IntegrationMarketplace from './pages/IntegrationMarketplace';
import IntegrationTests from './pages/IntegrationTests';
import InvoicePortal from './pages/InvoicePortal';
import KaufnebenkostenRechner from './pages/KaufnebenkostenRechner';
import KaufpreisRechner from './pages/KaufpreisRechner';
import Kautionsrueckforderung from './pages/Kautionsrueckforderung';
import KnowledgeBaseManager from './pages/KnowledgeBaseManager';
import Kuendigung from './pages/Kuendigung';
import Kuendigungsbestaetigung from './pages/Kuendigungsbestaetigung';
import LetterXpressApp from './pages/LetterXpressApp';
import LoadBalancerManager from './pages/LoadBalancerManager';
import LocalizationSettings from './pages/LocalizationSettings';
import LogAggregationDashboard from './pages/LogAggregationDashboard';
import Maengelanzeige from './pages/Maengelanzeige';
import MahnschreibenGenerator from './pages/MahnschreibenGenerator';
import Mahnung from './pages/Mahnung';
import Maklerauftrag from './pages/Maklerauftrag';
import MaklercourtageVertrag from './pages/MaklercourtageVertrag';
import MaklergeboehrenRueckforderung from './pages/MaklergeboehrenRueckforderung';
import Marketplace from './pages/Marketplace';
import MeineDokumente from './pages/MeineDokumente';
import MessagingCenter from './pages/MessagingCenter';
import MetricsDashboard from './pages/MetricsDashboard';
import Mietaufhebungsvertrag from './pages/Mietaufhebungsvertrag';
import MietausfallRechner from './pages/MietausfallRechner';
import Mietbuergschaft from './pages/Mietbuergschaft';
import MieterInfoEigentumerwechsel from './pages/MieterInfoEigentumerwechsel';
import MieterScreeningReport from './pages/MieterScreeningReport';
import Mieterhoehung from './pages/Mieterhoehung';
import MieterhoehungsWiderspruch from './pages/MieterhoehungsWiderspruch';
import MieterhoehunsWiderspruch from './pages/MieterhoehunsWiderspruch';
import mieterhHungsrechner from './pages/MieterhöhungsRechner';
import Mieterselbstauskunft from './pages/Mieterselbstauskunft';
import Mietminderung from './pages/Mietminderung';
import Mietminderungsreaktion from './pages/Mietminderungsreaktion';
import MietpreisBremseChecker from './pages/MietpreisBremseChecker';
import MietrechtAssistent from './pages/MietrechtAssistent';
import Mietschuldenfreiheit from './pages/Mietschuldenfreiheit';
import Mietvertrag from './pages/Mietvertrag';
import MietvertragTemplate from './pages/MietvertragTemplate';
import Mietzeugnis from './pages/Mietzeugnis';
import MonitoringCenter from './pages/MonitoringCenter';
import MonitoringDashboard from './pages/MonitoringDashboard';
import MultiCurrencyManager from './pages/MultiCurrencyManager';
import MultiTenantSetup from './pages/MultiTenantSetup';
import MyDocumentShares from './pages/MyDocumentShares';
import Nachbarschaftsbescheinigung from './pages/Nachbarschaftsbescheinigung';
import Nachtragsvereinbarung from './pages/Nachtragsvereinbarung';
import NebenkostenUmlageRechner from './pages/NebenkostenUmlageRechner';
import Nebenkostenabrechnung from './pages/Nebenkostenabrechnung';
import NettoanfangsrenditeRechner from './pages/NettoanfangsrenditeRechner';
import NetworkPolicyController from './pages/NetworkPolicyController';
import NotificationCenter from './pages/NotificationCenter';
import NotificationPreferences from './pages/NotificationPreferences';
import NotificationRules from './pages/NotificationRules';
import NotificationTemplateManager from './pages/NotificationTemplateManager';
import ObservabilityDashboard from './pages/ObservabilityDashboard';
import Onboarding from './pages/Onboarding';
import OptimizedFormBuilder from './pages/OptimizedFormBuilder';
import OrdentlicheKuendigung from './pages/OrdentlicheKuendigung';
import PartnerPortal from './pages/PartnerPortal';
import PaymentMatchingDashboard from './pages/PaymentMatchingDashboard';
import PaymentOrchestration from './pages/PaymentOrchestration';
import PaymentPlanManagement from './pages/PaymentPlanManagement';
import PaymentReconciliationDashboard from './pages/PaymentReconciliationDashboard';
import PayoutManagement from './pages/PayoutManagement';
import PerformanceMonitor from './pages/PerformanceMonitor';
import PerformanceMonitoring from './pages/PerformanceMonitoring';
import PerformanceSettings from './pages/PerformanceSettings';
import Privacy from './pages/Privacy';
import ProductionReadiness from './pages/ProductionReadiness';
import Profile from './pages/Profile';
import PublicSharePage from './pages/PublicSharePage';
import QuickStart from './pages/QuickStart';
import RateLimitDashboard from './pages/RateLimitDashboard';
import RateLimitManagement from './pages/RateLimitManagement';
import RealtimeCollaboration from './pages/RealtimeCollaboration';
import RealtimeCollaborationEditor from './pages/RealtimeCollaborationEditor';
import RealtimeDemo from './pages/RealtimeDemo';
import RechnerUebersicht from './pages/RechnerUebersicht';
import Register from './pages/Register';
import RenditeRechner from './pages/RenditeRechner';
import RenovierungsRechner from './pages/RenovierungsRechner';
import ReportBuilder from './pages/ReportBuilder';
import ResourceQuotaManager from './pages/ResourceQuotaManager';
import RetentionLoyalty from './pages/RetentionLoyalty';
import RevenueForecasting from './pages/RevenueForecasting';
import RoleManagement from './pages/RoleManagement';
import SCHUFAPruefung from './pages/SCHUFAPruefung';
import SEPALastschriftmandat from './pages/SEPALastschriftmandat';
import SavedCalculations from './pages/SavedCalculations';
import Schoenheitsreparaturenprotokoll from './pages/Schoenheitsreparaturenprotokoll';
import SchufaAuskunft from './pages/SchufaAuskunft';
import SearchCenter from './pages/SearchCenter';
import SecretVaultManager from './pages/SecretVaultManager';
import SecurityDashboard from './pages/SecurityDashboard';
import SecuritySettings from './pages/SecuritySettings';
import ServiceHealth from './pages/ServiceHealth';
import ServiceHealthMonitor from './pages/ServiceHealthMonitor';
import ServiceMeshManager from './pages/ServiceMeshManager';
import Settings from './pages/Settings';
import SettingsAdvanced from './pages/SettingsAdvanced';
import ShareAnalyticsDashboard from './pages/ShareAnalyticsDashboard';
import ShareBulkManager from './pages/ShareBulkManager';
import SharedDocuments from './pages/SharedDocuments';
import Staffelmietvertrag from './pages/Staffelmietvertrag';
import StellplatzGaragenvertrag from './pages/StellplatzGaragenvertrag';
import SteuersparungsRechner from './pages/SteuersparungsRechner';
import StripeIntegrationGuide from './pages/StripeIntegrationGuide';
import SubscriptionAnalyticsDashboard from './pages/SubscriptionAnalyticsDashboard';
import SubscriptionManagement from './pages/SubscriptionManagement';
import SupabaseIntegrityDashboard from './pages/SupabaseIntegrityDashboard';
import SystemArchitecture from './pages/SystemArchitecture';
import SystemHealth from './pages/SystemHealth';
import SystemSettings from './pages/SystemSettings';
import SystemStatus from './pages/SystemStatus';
import TaskManagement from './pages/TaskManagement';
import TaxConfiguration from './pages/TaxConfiguration';
import TaxExemptionManagement from './pages/TaxExemptionManagement';
import TeamManagement from './pages/TeamManagement';
import TeamSpaceManager from './pages/TeamSpaceManager';
import TemplateCheckoutSuccess from './pages/TemplateCheckoutSuccess';
import TemplateDetail from './pages/TemplateDetail';
import TemplateManagement from './pages/TemplateManagement';
import TenantScoringRechner from './pages/TenantScoringRechner';
import Tool from './pages/Tool';
import ToolResult from './pages/ToolResult';
import TrafficAnalyticsDashboard from './pages/TrafficAnalyticsDashboard';
import Uebergabeprotokoll from './pages/Uebergabeprotokoll';
import UebergabeprotokollGenerator from './pages/UebergabeprotokollGenerator';
import Untermieterlaubnis from './pages/Untermieterlaubnis';
import UsageAlerts from './pages/UsageAlerts';
import UsageMeteringDashboard from './pages/UsageMeteringDashboard';
import UserAIDashboard from './pages/UserAIDashboard';
import UserActivityDashboard from './pages/UserActivityDashboard';
import UserProfile from './pages/UserProfile';
import VergleichsmietRechner from './pages/VergleichsmietRechner';
import Verify from './pages/Verify';
import verkaufserlSrechner from './pages/VerkaufserlösRechner';
import Verwaltervertrag from './pages/Verwaltervertrag';
import Vorvermieterbescheinigung from './pages/Vorvermieterbescheinigung';
import WGMietvertrag from './pages/WGMietvertrag';
import WebhookIntegrationPanel from './pages/WebhookIntegrationPanel';
import WebhookManagement from './pages/WebhookManagement';
import WebhookManager from './pages/WebhookManager';
import WhiteLabelStudio from './pages/WhiteLabelStudio';
import Wohnungsgeberbestaetigung from './pages/Wohnungsgeberbestaetigung';
import WorkflowAutomation from './pages/WorkflowAutomation';
import WorkflowBuilder from './pages/WorkflowBuilder';
import WorkspaceManager from './pages/WorkspaceManager';
import Zahlungsplan from './pages/Zahlungsplan';
import ZahlungsplanVereinbarung from './pages/ZahlungsplanVereinbarung';
import ZeitmietvertragMoebliert from './pages/ZeitmietvertragMoebliert';
import FormularIndex from './pages/FormularIndex';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIChatDemo": AIChatDemo,
    "AIFormBuilder": AIFormBuilder,
    "AIRecommendations": AIRecommendations,
    "AISettings": AISettings,
    "AISystemPromptManager": AISystemPromptManager,
    "AISystemPrompts": AISystemPrompts,
    "AITestSuite": AITestSuite,
    "AIUsageReports": AIUsageReports,
    "APIDocumentation": APIDocumentation,
    "APIGatewayDashboard": APIGatewayDashboard,
    "APIGatewayManager": APIGatewayManager,
    "APIKeyManagement": APIKeyManagement,
    "APIManagement": APIManagement,
    "APIReference": APIReference,
    "Abmahnung": Abmahnung,
    "AccessControlManager": AccessControlManager,
    "AdminAuditLogs": AdminAuditLogs,
    "AdminBillingAnalytics": AdminBillingAnalytics,
    "AdminBillingInsights": AdminBillingInsights,
    "AdminBrandingStudio": AdminBrandingStudio,
    "AdminDashboard": AdminDashboard,
    "AdminDashboardAI": AdminDashboardAI,
    "AdminDashboardMain": AdminDashboardMain,
    "AdminGDPRManagement": AdminGDPRManagement,
    "AdminInvoiceManagement": AdminInvoiceManagement,
    "AdminShareManagement": AdminShareManagement,
    "AdminUserManagement": AdminUserManagement,
    "AdvancedAnalytics": AdvancedAnalytics,
    "AdvancedAnalyticsDashboard": AdvancedAnalyticsDashboard,
    "AdvancedSearch": AdvancedSearch,
    "AmortisationsRechner": AmortisationsRechner,
    "AnalyticsDashboard": AnalyticsDashboard,
    "AnalyticsDashboardStudio": AnalyticsDashboardStudio,
    "AnlageV": AnlageV,
    "AppMarketplace": AppMarketplace,
    "AuditLogs": AuditLogs,
    "AutoScalingController": AutoScalingController,
    "BackupManagement": BackupManagement,
    "BackupRecovery": BackupRecovery,
    "BankExpose": BankExpose,
    "Betriebskostenabrechnung": Betriebskostenabrechnung,
    "BewertungsRechner": BewertungsRechner,
    "Billing": Billing,
    "BillingAnalyticsDashboard": BillingAnalyticsDashboard,
    "BillingInvoices": BillingInvoices,
    "BillingSuccess": BillingSuccess,
    "BrandingManager": BrandingManager,
    "BrandingStudio": BrandingStudio,
    "BulkOperationsManager": BulkOperationsManager,
    "CO2Calculator": CO2Calculator,
    "CacheManagement": CacheManagement,
    "CanaryDeploymentManager": CanaryDeploymentManager,
    "CashflowRechner": CashflowRechner,
    "ChargebackManagement": ChargebackManagement,
    "Checkout": Checkout,
    "CheckoutSuccess": CheckoutSuccess,
    "ComplianceCenter": ComplianceCenter,
    "ComplianceTracker": ComplianceTracker,
    "ConfigurationCenter": ConfigurationCenter,
    "ContainerOrchestration": ContainerOrchestration,
    "ContentManager": ContentManager,
    "ContentVersioning": ContentVersioning,
    "ContractManagement": ContractManagement,
    "CostAnalyzer": CostAnalyzer,
    "CreatorDashboard": CreatorDashboard,
    "CreditManagement": CreditManagement,
    "CrossAppSync": CrossAppSync,
    "CrossSellDemo": CrossSellDemo,
    "CustomReporting": CustomReporting,
    "CustomerIntelligence": CustomerIntelligence,
    "CustomerSuccessDashboard": CustomerSuccessDashboard,
    "Dashboard": Dashboard,
    "DataExportCenter": DataExportCenter,
    "DataMigration": DataMigration,
    "DataPrivacy": DataPrivacy,
    "DatabaseOptimizer": DatabaseOptimizer,
    "DelinquencyManagement": DelinquencyManagement,
    "DeploymentPipelineManager": DeploymentPipelineManager,
    "DeveloperPortal": DeveloperPortal,
    "DisasterRecovery": DisasterRecovery,
    "DisputeManagement": DisputeManagement,
    "DocuSignApp": DocuSignApp,
    "DocumentIntelligence": DocumentIntelligence,
    "DocumentOCRUpload": DocumentOCRUpload,
    "DocumentSearch": DocumentSearch,
    "DownloadApps": DownloadApps,
    "DunningManagement": DunningManagement,
    "Eigenbedarfskuendigung": Eigenbedarfskuendigung,
    "EigenkapitalrentabilitaetRechner": EigenkapitalrentabilitaetRechner,
    "EmailCampaignBuilder": EmailCampaignBuilder,
    "EmailMarketing": EmailMarketing,
    "EmailNotificationSettings": EmailNotificationSettings,
    "EmailTemplates": EmailTemplates,
    "Energieausweis": Energieausweis,
    "EnterpriseSettings": EnterpriseSettings,
    "ExportHistory": ExportHistory,
    "FeatureFlagManager": FeatureFlagManager,
    "Ferienwohnungsvertrag": Ferienwohnungsvertrag,
    "FinAPISync": FinAPISync,
    "FinalSummary": FinalSummary,
    "FinancialReporting": FinancialReporting,
    "FinanzierungsRechner": FinanzierungsRechner,
    "FintuttoEcosystemHub": FintuttoEcosystemHub,
    "FormDesigner": FormDesigner,
    "FormulareIndex": FormulareIndex,
    "FraudDetection": FraudDetection,
    "Gewerbemietvertrag": Gewerbemietvertrag,
    "GewerbemietvertragTemplate": GewerbemietvertragTemplate,
    "GlobalSearch": GlobalSearch,
    "HaerteffallEinwand": HaerteffallEinwand,
    "HandlePayPalReturn": HandlePayPalReturn,
    "Hausordnung": Hausordnung,
    "HausordnungGenerator": HausordnungGenerator,
    "Home": Home,
    "ImmoScout24Sync": ImmoScout24Sync,
    "ImprovedDashboard": ImprovedDashboard,
    "IncidentManagement": IncidentManagement,
    "IndexmietRechner": IndexmietRechner,
    "IndexmieteAnpassung": IndexmieteAnpassung,
    "Indexmietvertrag": Indexmietvertrag,
    "InstandhaltungsRueckstellung": InstandhaltungsRueckstellung,
    "IntegrationBuilder": IntegrationBuilder,
    "IntegrationManager": IntegrationManager,
    "IntegrationMarketplace": IntegrationMarketplace,
    "IntegrationTests": IntegrationTests,
    "InvoicePortal": InvoicePortal,
    "KaufnebenkostenRechner": KaufnebenkostenRechner,
    "KaufpreisRechner": KaufpreisRechner,
    "Kautionsrueckforderung": Kautionsrueckforderung,
    "KnowledgeBaseManager": KnowledgeBaseManager,
    "Kuendigung": Kuendigung,
    "Kuendigungsbestaetigung": Kuendigungsbestaetigung,
    "LetterXpressApp": LetterXpressApp,
    "LoadBalancerManager": LoadBalancerManager,
    "LocalizationSettings": LocalizationSettings,
    "LogAggregationDashboard": LogAggregationDashboard,
    "Maengelanzeige": Maengelanzeige,
    "MahnschreibenGenerator": MahnschreibenGenerator,
    "Mahnung": Mahnung,
    "Maklerauftrag": Maklerauftrag,
    "MaklercourtageVertrag": MaklercourtageVertrag,
    "MaklergeboehrenRueckforderung": MaklergeboehrenRueckforderung,
    "Marketplace": Marketplace,
    "MeineDokumente": MeineDokumente,
    "MessagingCenter": MessagingCenter,
    "MetricsDashboard": MetricsDashboard,
    "Mietaufhebungsvertrag": Mietaufhebungsvertrag,
    "MietausfallRechner": MietausfallRechner,
    "Mietbuergschaft": Mietbuergschaft,
    "MieterInfoEigentumerwechsel": MieterInfoEigentumerwechsel,
    "MieterScreeningReport": MieterScreeningReport,
    "Mieterhoehung": Mieterhoehung,
    "MieterhoehungsWiderspruch": MieterhoehungsWiderspruch,
    "MieterhoehunsWiderspruch": MieterhoehunsWiderspruch,
    "MieterhöhungsRechner": mieterhHungsrechner,
    "Mieterselbstauskunft": Mieterselbstauskunft,
    "Mietminderung": Mietminderung,
    "Mietminderungsreaktion": Mietminderungsreaktion,
    "MietpreisBremseChecker": MietpreisBremseChecker,
    "MietrechtAssistent": MietrechtAssistent,
    "Mietschuldenfreiheit": Mietschuldenfreiheit,
    "Mietvertrag": Mietvertrag,
    "MietvertragTemplate": MietvertragTemplate,
    "Mietzeugnis": Mietzeugnis,
    "MonitoringCenter": MonitoringCenter,
    "MonitoringDashboard": MonitoringDashboard,
    "MultiCurrencyManager": MultiCurrencyManager,
    "MultiTenantSetup": MultiTenantSetup,
    "MyDocumentShares": MyDocumentShares,
    "Nachbarschaftsbescheinigung": Nachbarschaftsbescheinigung,
    "Nachtragsvereinbarung": Nachtragsvereinbarung,
    "NebenkostenUmlageRechner": NebenkostenUmlageRechner,
    "Nebenkostenabrechnung": Nebenkostenabrechnung,
    "NettoanfangsrenditeRechner": NettoanfangsrenditeRechner,
    "NetworkPolicyController": NetworkPolicyController,
    "NotificationCenter": NotificationCenter,
    "NotificationPreferences": NotificationPreferences,
    "NotificationRules": NotificationRules,
    "NotificationTemplateManager": NotificationTemplateManager,
    "ObservabilityDashboard": ObservabilityDashboard,
    "Onboarding": Onboarding,
    "OptimizedFormBuilder": OptimizedFormBuilder,
    "OrdentlicheKuendigung": OrdentlicheKuendigung,
    "PartnerPortal": PartnerPortal,
    "PaymentMatchingDashboard": PaymentMatchingDashboard,
    "PaymentOrchestration": PaymentOrchestration,
    "PaymentPlanManagement": PaymentPlanManagement,
    "PaymentReconciliationDashboard": PaymentReconciliationDashboard,
    "PayoutManagement": PayoutManagement,
    "PerformanceMonitor": PerformanceMonitor,
    "PerformanceMonitoring": PerformanceMonitoring,
    "PerformanceSettings": PerformanceSettings,
    "Privacy": Privacy,
    "ProductionReadiness": ProductionReadiness,
    "Profile": Profile,
    "PublicSharePage": PublicSharePage,
    "QuickStart": QuickStart,
    "RateLimitDashboard": RateLimitDashboard,
    "RateLimitManagement": RateLimitManagement,
    "RealtimeCollaboration": RealtimeCollaboration,
    "RealtimeCollaborationEditor": RealtimeCollaborationEditor,
    "RealtimeDemo": RealtimeDemo,
    "RechnerUebersicht": RechnerUebersicht,
    "Register": Register,
    "RenditeRechner": RenditeRechner,
    "RenovierungsRechner": RenovierungsRechner,
    "ReportBuilder": ReportBuilder,
    "ResourceQuotaManager": ResourceQuotaManager,
    "RetentionLoyalty": RetentionLoyalty,
    "RevenueForecasting": RevenueForecasting,
    "RoleManagement": RoleManagement,
    "SCHUFAPruefung": SCHUFAPruefung,
    "SEPALastschriftmandat": SEPALastschriftmandat,
    "SavedCalculations": SavedCalculations,
    "Schoenheitsreparaturenprotokoll": Schoenheitsreparaturenprotokoll,
    "SchufaAuskunft": SchufaAuskunft,
    "SearchCenter": SearchCenter,
    "SecretVaultManager": SecretVaultManager,
    "SecurityDashboard": SecurityDashboard,
    "SecuritySettings": SecuritySettings,
    "ServiceHealth": ServiceHealth,
    "ServiceHealthMonitor": ServiceHealthMonitor,
    "ServiceMeshManager": ServiceMeshManager,
    "Settings": Settings,
    "SettingsAdvanced": SettingsAdvanced,
    "ShareAnalyticsDashboard": ShareAnalyticsDashboard,
    "ShareBulkManager": ShareBulkManager,
    "SharedDocuments": SharedDocuments,
    "Staffelmietvertrag": Staffelmietvertrag,
    "StellplatzGaragenvertrag": StellplatzGaragenvertrag,
    "SteuersparungsRechner": SteuersparungsRechner,
    "StripeIntegrationGuide": StripeIntegrationGuide,
    "SubscriptionAnalyticsDashboard": SubscriptionAnalyticsDashboard,
    "SubscriptionManagement": SubscriptionManagement,
    "SupabaseIntegrityDashboard": SupabaseIntegrityDashboard,
    "SystemArchitecture": SystemArchitecture,
    "SystemHealth": SystemHealth,
    "SystemSettings": SystemSettings,
    "SystemStatus": SystemStatus,
    "TaskManagement": TaskManagement,
    "TaxConfiguration": TaxConfiguration,
    "TaxExemptionManagement": TaxExemptionManagement,
    "TeamManagement": TeamManagement,
    "TeamSpaceManager": TeamSpaceManager,
    "TemplateCheckoutSuccess": TemplateCheckoutSuccess,
    "TemplateDetail": TemplateDetail,
    "TemplateManagement": TemplateManagement,
    "TenantScoringRechner": TenantScoringRechner,
    "Tool": Tool,
    "ToolResult": ToolResult,
    "TrafficAnalyticsDashboard": TrafficAnalyticsDashboard,
    "Uebergabeprotokoll": Uebergabeprotokoll,
    "UebergabeprotokollGenerator": UebergabeprotokollGenerator,
    "Untermieterlaubnis": Untermieterlaubnis,
    "UsageAlerts": UsageAlerts,
    "UsageMeteringDashboard": UsageMeteringDashboard,
    "UserAIDashboard": UserAIDashboard,
    "UserActivityDashboard": UserActivityDashboard,
    "UserProfile": UserProfile,
    "VergleichsmietRechner": VergleichsmietRechner,
    "Verify": Verify,
    "VerkaufserlösRechner": verkaufserlSrechner,
    "Verwaltervertrag": Verwaltervertrag,
    "Vorvermieterbescheinigung": Vorvermieterbescheinigung,
    "WGMietvertrag": WGMietvertrag,
    "WebhookIntegrationPanel": WebhookIntegrationPanel,
    "WebhookManagement": WebhookManagement,
    "WebhookManager": WebhookManager,
    "WhiteLabelStudio": WhiteLabelStudio,
    "Wohnungsgeberbestaetigung": Wohnungsgeberbestaetigung,
    "WorkflowAutomation": WorkflowAutomation,
    "WorkflowBuilder": WorkflowBuilder,
    "WorkspaceManager": WorkspaceManager,
    "Zahlungsplan": Zahlungsplan,
    "ZahlungsplanVereinbarung": ZahlungsplanVereinbarung,
    "ZeitmietvertragMoebliert": ZeitmietvertragMoebliert,
    "FormularIndex": FormularIndex,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};