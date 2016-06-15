Ext.define('PVE.qemu.Summary', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pveQemuSummary',

    scrollable: true,
    bodyPadding: 10,

    initComponent: function() {
        var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) {
	    throw "no node name specified";
	}

	var vmid = me.pveSelNode.data.vmid;
	if (!vmid) {
	    throw "no VM ID specified";
	}

	if (!me.workspace) {
	    throw "no workspace specified";
	}

	if (!me.statusStore) {
	    throw "no status storage specified";
	}

	var template = !!me.pveSelNode.data.template;
	var rstore = me.statusStore;

	var statusview = Ext.create('PVE.qemu.StatusView', {
	    title: gettext('Status'),
	    pveSelNode: me.pveSelNode,
	    width: template ? 800 : 400,
	    rstore: rstore
	});

	var notesview = Ext.create('PVE.panel.NotesView', {
	    pveSelNode: me.pveSelNode,
	    padding: template? '10 0 0 0' : '0 0 0 10',
	    flex: 1
	});

	if (template) {

	    Ext.apply(me, {
		plugins: {
		    ptype: 'lazyitems',
		    items: [
			{
			    xtype: 'container',
			    layout: {
				type: 'column'
			    },
			    defaults: {
				padding: '0 10 10 0'
			    },
			    items: [{
				width: 800,
				layout: {
				    type: 'vbox',
				    align: 'stretch'
				},
				border: false,
				items: [ statusview, notesview ]
			    }]
			}
		    ]
		},
		listeners: {
		    activate: function() { notesview.load(); }
		}
	    });

	} else {
	    var rrdstore = Ext.create('PVE.data.RRDStore', {
		rrdurl: "/api2/json/nodes/" + nodename + "/qemu/" + vmid + "/rrddata"
	    });

	    Ext.apply(me, {
		tbar: [ '->', { xtype: 'pveRRDTypeSelector' } ],
		plugins: {
		    ptype: 'lazyitems',
		    items: [
			{
			    xtype: 'container',
			    layout: {
				type: 'column'
			    },
			    defaults: {
				padding: '0 10 10 0'
			    },
			    items: [
				{
				    width: 800,
				    height: 300,
				    layout: {
					type: 'hbox',
					align: 'stretch'
				    },
				    border: false,
				    items: [ statusview, notesview ]
				},
				{
				    xtype: 'pveRRDChart',
				    title: gettext('CPU usage'),
				    pveSelNode: me.pveSelNode,
				    fields: ['cpu'],
				    fieldTitles: [gettext('CPU usage')],
				    store: rrdstore
				},
				{
				    xtype: 'pveRRDChart',
				    title: gettext('Memory usage'),
				    pveSelNode: me.pveSelNode,
				    fields: ['maxmem', 'mem'],
				    fieldTitles: [gettext('Total'), gettext('RAM usage')],
				    store: rrdstore
				},
				{
				    xtype: 'pveRRDChart',
				    title: gettext('Network traffic'),
				    pveSelNode: me.pveSelNode,
				    fields: ['netin','netout'],
				    store: rrdstore
				},
				{
				    xtype: 'pveRRDChart',
				    title: gettext('Disk IO'),
				    pveSelNode: me.pveSelNode,
				    fields: ['diskread','diskwrite'],
				    store: rrdstore
				}
			    ]
			}
		    ]
		},
		listeners: {
		    activate: function() {notesview.load(); rrdstore.startUpdate();},
		    hide: rrdstore.stopUpdate,
		    destroy: rrdstore.stopUpdate
		}
	    });
	}

	me.callParent();
    }
});
