$(function () {
    //var log = function (previousValue, currentValue) {
    //    console.log({ original: previousValue, current: currentValue, time: new Date() });
    //};
    
    ko.observable.fn.onChanged = function (callback, propName) {
        var base = this,
            previousValue = undefined,
            propertyName = propName;

        base.subscribe(function (previous) {
            previousValue = previous;
        }, base, 'beforeChange');

        base.subscribe(function (latestValue) {
            var changed = previousValue != latestValue;
            if (changed) {
                callback(propertyName, previousValue, latestValue);
            }
            previousValue = latestValue;
        });

        return ko.computed({
            read: function () { return base(); },
            write: function (newValue) { base(newValue); }
        });
    };
    
    function ServerSideStore() {
        var self = this,
            baseUrl = "/Home",
            xhr = function (requestdata) {
                requestdata.type = requestdata.type || 'GET';
                requestdata.dataType = requestdata.dataType || 'json';
                requestdata.contentType = requestdata.contentType || 'application/json; charset=utf-8';

                return $.ajax(requestdata);
            };

        return {
            get: function (userId, successCallback) {
                var data = { userId: userId };
                return xhr({ url: baseUrl, data: data, success: successCallback });
            },
            put: function (item) {
                var data = { item: item };
                return xhr({ url: baseUrl, data: JSON.stringify(data), success: console.log, type: 'POST' });
            }
        };
    }
    
    function History() {
        var self = this,
            globalHistory = [],
            add = function (item) {
                globalHistory.push(item);
            },
            removeLast = function () {
                globalHistory = globalHistory.slice(0, globalHistory.length - 1);
            },
            sortedHistory = function () {
                globalHistory.sort(function (l, r) {
                    if (l.time > r.time) return 1;
                    if (l.time < r.time) return -1;
                    return 0;
                });
                return globalHistory;
            };

        return {
            history: sortedHistory,
            add: add,
            removeLast: removeLast
        };
    }
    
    function Section(name) {
        var self = this;
        self.name = ko.observable(name);//.onChanged(self.log, 'sections.name');
    }

    function ViewModel(vm, userId) {
        var self = this;
        self.skip = false;
        
        self.history = ko.observableArray([]);
        self.vm = vm;
        self.userId = userId;
        
        self.globalHistory = new History();
        self.storage = new ServerSideStore();

        self.log = function (prop, prev, curr) {
            if (!self.skip) {
                var item = { property: prop, original: prev, current: curr, time: new Date(), userId: self.userId };
                self.history.push(item);
                self.globalHistory.add(item);
                self.storage.put(item);
            }
        };

        self.name = ko.observable("John").onChanged(self.log, 'name');
        self.email = ko.observable("john.stclair@statkraft.com").onChanged(self.log, 'email');

        self.section = new Section('item1');
        self.section.name.onChanged(self.log, 'section.name');
        
        //self.sections = ko.observableArray(
        //    [
        //        new Section('item1', self.history),
        //        new Section('item2', self.history)
        //    ]);

        self.reset = function () {
            self.skip = true;
            
            self.name("John");
            self.email("john.stclair@statkraft.com");
            self.section.name('item1');
            self.history([]);
            
            self.skip = false;
        };

        self.load = function () {
            var success = function (data) {
                self.loadFrom(data);
            };
            
            self.storage.get(self.userId, success);
        };
        
        self.rebuild = function () {
            self.loadFrom(self.globalHistory.history());
        };

        self.loadFrom = function (items) {
            console.log(items);
            ko.utils.arrayForEach(items, function (item) {
                var props = item.property.split('.'),
                    p = null,
                    that = self;
                for (var i = 0; i < props.length; i++) {
                    p = that[props[i]];
                    if (i < props.length - 1 && typeof p == "function") {
                        p = p();
                    }
                    that = p;
                }

                if (p && typeof p == "function") {
                    p(item.current);
                }
                //self[item.property](item.current);
            });
        };
    }

    var vm1 = new ViewModel('ViewModel 1', 'john');
    var vm2 = new ViewModel('ViewModel 2', 'jrs');

    ko.applyBindings(vm1, document.getElementById('vm1'));
    ko.applyBindings(vm2, document.getElementById('vm2'));
});