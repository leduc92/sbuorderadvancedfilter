import template from './sw-sidebar-navigation-item.html.twig';
import './sw-sidebar-navigation-item.scss';

const { Component } = Shopware;

Component.override('sw-sidebar-navigation-item', {
    template
});
