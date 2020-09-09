const { Component } = Shopware;

Component.override('sw-sidebar-item', {
    props: {
        badge: {
            type: Number,
            required: false
        },
    }
});
