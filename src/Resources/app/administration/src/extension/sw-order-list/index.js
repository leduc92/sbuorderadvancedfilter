import template from './sw-order-list.html.twig';
import './sw-order-list.scss';
import { DATE_OPTIONS } from '../../constant/sbu-order-advanced-filter.constant';

const { Component } = Shopware;
const { Criteria } = Shopware.Data;

Component.override('sw-order-list', {
    template,

    inject: [
        'repositoryFactory'
    ],

    computed: {
        sateMachineRepository() {
            return this.repositoryFactory.create('state_machine');
        },

        paymentMethodRepository() {
            return this.repositoryFactory.create('payment_method');
        },

        shippingMethodRepository() {
            return this.repositoryFactory.create('shipping_method');
        },

        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },

        today() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return today;
        },

        orderCriteria() {
            const criteria = this.$super('orderCriteria');


            if (this.salesChannelId) {
                criteria.addFilter(Criteria.equals('salesChannelId', this.salesChannelId));
            }

            if (this.orderStateId) {
                criteria.addFilter(Criteria.equals('stateId', this.orderStateId));
            }

            if (this.paymentStateId) {
                criteria.addFilter(Criteria.equals('transactions.stateId', this.paymentStateId));
            }

            if (this.paymentMethodId) {
                criteria.addFilter(Criteria.equals('transactions.paymentMethodId', this.paymentMethodId));
            }

            if (this.shippingMethodId) {
                criteria.addFilter(Criteria.equals('deliveries.shippingMethodId', this.shippingMethodId));
            }

            if (this.deliveryStateId) {
                criteria.addFilter(Criteria.equals('deliveries.stateId', this.deliveryStateId));
            }

            if (this.startDate) {
                criteria.addFilter(Criteria.range('orderDate', { gte: this.formatDate(this.startDate) }));
            }

            if (this.endDate) {
                criteria.addFilter(Criteria.range('orderDate', { lte: this.formatDate(this.endDate) }));
            }

            return criteria;
        },

        datesOptions() {
            return [
                {
                    value: DATE_OPTIONS.TODAY,
                    name: this.$tc('sbu-order-advanced-filler.today')
                },
                {
                    value: DATE_OPTIONS.YESTERDAY,
                    name: this.$tc('sbu-order-advanced-filler.yesterday')
                },
                {
                    value: DATE_OPTIONS.LAST_SEVEN_DAYS,
                    name: this.$tc('sbu-order-advanced-filler.last_seven_days')
                },
                {
                    value: DATE_OPTIONS.LAST_THIRTY_DAYS,
                    name: this.$tc('sbu-order-advanced-filler.last_thirty_days')
                },
                {
                    value: DATE_OPTIONS.THIS_MONTH,
                    name: this.$tc('sbu-order-advanced-filler.this_month')
                },
                {
                    value: DATE_OPTIONS.LAST_MONTH,
                    name: this.$tc('sbu-order-advanced-filler.last_month')
                },
                {
                    value: DATE_OPTIONS.CUSTOM,
                    name: this.$tc('sbu-order-advanced-filler.custom')
                },
            ]
        },

        isCustomDate() {
            return this.byDate === DATE_OPTIONS.CUSTOM;
        },

        stateMachineStateRepository() {
            return this.repositoryFactory.create('state_machine_state');
        },

        numberOfFiltering() {
            let counting = 0;

            Object.keys(this.filtering).forEach(key => {
                counting += this.filtering[key] ? 1 : 0;
            });

            if(this.campaignCodeFilter.length) {
                counting += 1;
            }

            if(this.affiliateCodeFilter.length) {
                counting += 1;
            }

            return counting;
        }
    },

    watch: {
        orderStateId() {
            this.filtering.orderStateSelected = this.orderStateId ? this.orderStatuses.get(this.orderStateId) : null;
        },

        paymentStateId() {
            this.filtering.paymentStateSelected = this.paymentStateId ? this.paymentStatuses.get(this.paymentStateId) : null;
        },

        deliveryStateId() {
            this.filtering.deliveryStateSelected = this.deliveryStateId ? this.deliveryStatuses.get(this.deliveryStateId) : null;
        },

        salesChannelId() {
            this.filtering.salesChannelSelected = this.salesChannelId ? this.salesChannels.get(this.salesChannelId) : null;
        },

        shippingMethodId() {
            this.filtering.shippingMethodSelected = this.shippingMethodId ? this.shippingMethods.get(this.shippingMethodId) : null;
        },

        paymentMethodId() {
            this.filtering.paymentMethodSelected = this.paymentMethodId ? this.paymentMethods.get(this.paymentMethodId) : null;
        },

        customStartDate() {
            this.startDate = this.customStartDate ? new Date(this.customStartDate) : null;
            this.filtering.dateSelected = this.customDateText();
        },

        customEndDate() {
            this.endDate = this.customEndDate ? new Date(this.customEndDate): null;
            this.filtering.dateSelected = this.customDateText();
        },

        filtering: {
            deep: true,
            handler: 'getList'
        }
    },

    data() {
        return {
            filtering: {
                salesChannelSelected: null,
                shippingMethodSelected: null,
                deliveryStateSelected: null,
                orderStateSelected: null,
                paymentStateSelected: null,
                paymentMethodSelected: null,
                dateSelected: null
            },

            salesChannelId: null,
            salesChannels: [],

            shippingMethodId: null,
            shippingMethods: [],

            deliveryStateId: null,
            deliveryStatuses: [],

            orderStateId: null,
            orderStatuses: [],

            paymentStateId: null,
            paymentStatuses: [],

            paymentMethodId: null,
            paymentMethods: [],

            byDate: null,
            startDate: null,
            endDate: null,

            customStartDate: null,
            customEndDate: null,
        }
    },

    methods: {
        createdComponent() {
            this.$super('createdComponent');

            this.getAllStates();

            this.getDefaultOptions();
        },

        async getDefaultOptions() {
            const criteria = new Criteria();
            criteria.addSorting({ field: 'name', order: 'ASC' });
            criteria.addFilter(Criteria.equals('active', true));
            criteria.setLimit(50);

            Promise.all([
                this.getShippingMethods(criteria),
                this.getPaymentMethods(criteria),
                this.getSalesChannels(criteria)
            ]);
        },

        async getShippingMethods(criteria) {
            const shippingMethods = await this.shippingMethodRepository.search(criteria, Shopware.Context.api);
            this.shippingMethods = this.parseOptions(shippingMethods);
        },

        async getPaymentMethods(criteria) {
            const paymentMethods = await this.paymentMethodRepository.search(criteria, Shopware.Context.api);
            this.paymentMethods = this.parseOptions(paymentMethods);
        },

        async getSalesChannels(criteria) {
            const salesChannels = await this.salesChannelRepository.search(criteria, Shopware.Context.api);
            this.salesChannels = this.parseOptions(salesChannels);
        },


        async getAllStates() {
            const statuses = await this.stateMachineStateRepository.search(this.stateMachineStateCriteria(), Shopware.Context.api);

            this.orderStatuses = this.buildTransitionStatuses(
                'order.state',
                statuses,
            );

            this.paymentStatuses = this.buildTransitionStatuses(
                'order_transaction.state',
                statuses,
            );

            this.deliveryStatuses = this.buildTransitionStatuses(
                'order_delivery.state',
                statuses,
            );
        },

        stateMachineStateCriteria() {
            const criteria = new Criteria();
            criteria.addSorting({ field: 'name', order: 'ASC' });
            criteria.addAssociation('stateMachine');
            criteria.addFilter(
                Criteria.equalsAny(
                    'state_machine_state.stateMachine.technicalName',
                    ['order.state', 'order_transaction.state', 'order_delivery.state']
                )
            );

            return criteria;
        },

        buildTransitionStatuses(stateMachineName, allTransitions) {
            const entries = allTransitions.filter((entry) => {
                return entry.stateMachine.technicalName === stateMachineName;
            });

            const statuses = entries.map((state) => {
                return {
                    id: state.id,
                    value: state.id,
                    name: state.translated.name
                };
            });

            return statuses;
        },

        onClearOrderStatus() {
            this.orderStateId = null;
        },

        onClearPaymentStatus() {
            this.paymentStateId = null;
        },

        onClearDeliveryStatus() {
            this.deliveryStateId = null;
        },

        onClearPaymentMethod() {
            this.paymentMethodId = null;
        },

        onClearSalesChannel() {
            this.salesChannelId = null;
        },

        onClearShippingMethod() {
            this.shippingMethodId = null;
        },

        onClearCampaignCode() {
            this.campaignCodeFilter = [];
            this.getList();
        },

        onClearAffiliateCode() {
            this.affiliateCodeFilter = [];
            this.getList();
        },

        onClearDates() {
            this.byDate = null;
            this.startDate = null;
            this.endDate = null;
            this.filtering.dateSelected = null;
        },

        onChangeFilterByDates() {
            this.endDate = this.today;

            switch (this.byDate) {
                case DATE_OPTIONS.TODAY:
                    this.startDate = this.today;
                    break;
                case DATE_OPTIONS.YESTERDAY:
                    const yesterday = new Date(new Date().setDate(this.today.getDate() - 1));
                    this.startDate = yesterday;
                    this.endDate = yesterday;
                    break;
                case DATE_OPTIONS.LAST_SEVEN_DAYS:
                    this.startDate = new Date(new Date().setDate(this.today.getDate() - 7));
                    break;
                case DATE_OPTIONS.LAST_THIRTY_DAYS:
                    this.startDate = new Date(new Date().setDate(this.today.getDate() - 30));
                    break;
                case DATE_OPTIONS.THIS_MONTH:
                    this.startDate = new Date(new Date().setDate(1));
                    break;
                case DATE_OPTIONS.LAST_MONTH:
                    const startDate = new Date(new Date().setMonth(this.today.getMonth() -1));
                    this.startDate = new Date(startDate.setDate(1));
                    const dayInMonth = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 0).getDate()
                    this.endDate = new Date(startDate.setDate(dayInMonth));
                    break;
                default:
                    this.endDate = null;
                    this.startDate = null;
                    this.customStartDate = null;
                    this.customEndDate = null;
            }

            if (this.byDate !== DATE_OPTIONS.CUSTOM) {
                Object.keys(this.datesOptions).forEach(key => {
                    if (this.datesOptions[key].value === this.byDate) {
                        this.filtering.dateSelected = this.datesOptions[key].name
                    }
                });
            }
        },

        onClearAllFilter() {
            this.onClearOrderStatus();
            this.onClearPaymentStatus();
            this.onClearDeliveryStatus();
            this.onClearPaymentMethod();
            this.onClearSalesChannel();
            this.onClearShippingMethod();
            this.onClearCampaignCode();
            this.onClearAffiliateCode();
            this.onClearDates();
        },

        formatDate(date) {
            return `${date.getFullYear()}-${(`0${date.getMonth() + 1}`).slice(-2)}-${date.getDate()}`;
        },

        parseOptions(options) {
            return options.map((option) => {
                return {
                    id: option.id,
                    value: option.id,
                    name: option.translated.name
                }
            });
        },

        customDateText() {
            if (this.startDate && this.endDate) {
                return this.formatDate(this.startDate) + ' - ' + this.formatDate(this.endDate);
            }

            if(this.startDate) {
                return this.$tc('sbu-order-advanced-filler.date_starting',
                    0,
                    { starting: this.formatDate(this.startDate) });
            }

            if(this.endDate) {
                return this.$tc('sbu-order-advanced-filler.date_ending',
                    0,
                    { ending: this.formatDate(this.endDate) });
            }

            return null;
        }
    }
});
