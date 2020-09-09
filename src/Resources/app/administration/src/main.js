import './extension/sw-order-list';
import './extension/sw-sidebar-navigation-item';
import './extension/sw-sidebar-item';
import './component/sbu-order-advanced-filter-collapse';

const { Module } = Shopware;

Module.register('sbu-order-advanced-filter', {
    routeMiddleware(next, currentRoute) {
        next(currentRoute);
    }
});
