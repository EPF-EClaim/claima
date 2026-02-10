using { ECLAIMVIEW } from './eclaims_view';

service ECLAIM_VIEW_SRV {
    entity ZEMP_REQUEST_VIEW        as projection on ECLAIMVIEW.ZEMP_REQUEST_VIEW;
    entity ZEMP_REQUEST_ITEM_VIEW   as projection on ECLAIMVIEW.ZEMP_REQUEST_ITEM_VIEW;
    entity ZEMP_REQUEST_PART_VIEW   as projection on ECLAIMVIEW.ZEMP_REQUEST_PART_VIEW;
    entity ZEMP_CLAIM_HEADER_VIEW   as projection on ECLAIMVIEW.ZEMP_CLAIM_HEADER_VIEW;
    entity ZEMP_CLAIM_ITEM_VIEW     as projection on ECLAIMVIEW.ZEMP_CLAIM_ITEM_VIEW;
};
