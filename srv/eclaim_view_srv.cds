using {ECLAIMVIEW} from './eclaims_view';

service ECLAIM_VIEW_SRV @(requires: 'authenticated-user') {
    entity ZEMP_REQUEST_VIEW        as projection on ECLAIMVIEW.ZEMP_REQUEST_VIEW;
    entity ZEMP_REQUEST_ITEM_VIEW   as projection on ECLAIMVIEW.ZEMP_REQUEST_ITEM_VIEW;
    entity ZEMP_REQUEST_PART_VIEW   as projection on ECLAIMVIEW.ZEMP_REQUEST_PART_VIEW;
    entity ZEMP_CLAIM_HEADER_VIEW   as projection on ECLAIMVIEW.ZEMP_CLAIM_HEADER_VIEW;

    entity ZEMP_CLAIM_ITEM_VIEW     as projection on ECLAIMVIEW.ZEMP_CLAIM_ITEM_VIEW;

    entity ZEMP_CLAIM_REPORT_SUMMARY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Admin_System',
                'DTD_Admin'
            ]
        },
        {
            grant: 'READ',
            to   : 'Admin_CC',
            where: (COST_CENTER = '$user.COST_CENTER')
        }
    ])                              as projection on ECLAIMVIEW.ZEMP_CLAIM_REPORT_SUMMARY;

    entity ZEMP_CLAIM_REPORT_DETAILS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Admin_System',
                'DTD_Admin'
            ]
        },
        {
            grant: 'READ',
            to   : 'Admin_CC',
            where: (COST_CENTER = '$user.COST_CENTER')
        }
    ])                              as projection on ECLAIMVIEW.ZEMP_CLAIM_REPORT_DETAILS;

    entity ZEMP_REQUEST_REPORT_SUMMARY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Admin_System',
                'DTD_Admin'
            ]
        },
        {
            grant: 'READ',
            to   : 'Admin_CC',
            where: (COST_CENTER = '$user.COST_CENTER')
        }
    ])                              as projection on ECLAIMVIEW.ZEMP_REQUEST_REPORT_SUMMARY;

    entity ZEMP_REQUEST_REPORT_DETAILS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Admin_System',
                'DTD_Admin'
            ]
        },
        {
            grant: 'READ',
            to   : 'Admin_CC',
            where: (COST_CENTER = '$user.COST_CENTER')
        }
    ])                              as projection on ECLAIMVIEW.ZEMP_REQUEST_REPORT_DETAILS;

    entity ZEMP_REQUEST_STATUS      as projection on ECLAIMVIEW.ZEMP_REQUEST_STATUS;
    entity ZEMP_CLAIM_STATUS_HEADER as projection on ECLAIMVIEW.ZEMP_CLAIM_STATUS_HEADER;
    entity ZEMP_CLAIM_STATUS_ITEM   as projection on ECLAIMVIEW.ZEMP_CLAIM_STATUS_ITEM;
    entity ZEMP_CLAIM_SUBMISSION    as projection on ECLAIMVIEW.ZEMP_CLAIM_SUBMISSION;
};
