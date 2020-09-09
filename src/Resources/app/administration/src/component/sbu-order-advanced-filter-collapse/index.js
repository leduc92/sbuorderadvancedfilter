import template from './sbu-order-advanced-filter-collapse.html.twig';
import './sbu-order-advanced-filter-collapse.scss';

const { Component } = Shopware;

Component.register('sbu-order-advanced-filter-collapse', {
    template,

    props: {
        title: {
            type: String,
            required: true,
            default: null
        },

        enableClear: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data() {
        return {
        };
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {

        },

        onClear() {
            if (this.enableClear) {
                this.$emit('on-clear');
            }
        }
    }
});
