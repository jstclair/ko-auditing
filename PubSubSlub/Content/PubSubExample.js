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
    
    function Section(name, history) {
        var self = this;
        //self.history = history;
        //self.log = function (name, prev, curr) {
        //    var item = { property: name, original: prev, current: curr, time: new Date() };
        //    self.history.push(item);
        //    globalLog(item);
        //};
        self.name = ko.observable(name);//.onChanged(self.log, 'sections.name');
    }

    function ViewModel() {
        var self = this;
        self.history = ko.observableArray([]);

        self.globalHistory = new History();

        self.log = function (name, prev, curr) {
            var item = { property: name, original: prev, current: curr, time: new Date() };
            self.history.push(item);
            self.globalHistory.add(item);
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
            self.name("John");
            self.globalHistory.removeLast();
            self.email("john.stclair@statkraft.com");
            self.globalHistory.removeLast();
            self.section.name('item1');
            self.globalHistory.removeLast();
            //self.sections(
            //    [
            //        new Section('item2', self.history),
            //        new Section('item3', self.history)
            //    ]);
            self.history([]);
        };
        
        self.rebuild = function () {
            ko.utils.arrayForEach(self.globalHistory.history(), function (item) {
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

    var vm = new ViewModel();

    ko.applyBindings(vm);
});