$(function () {
    var vm = {
        name: ko.observable("John").publishOn('vm'),
        email: ko.observable("john.stclair@statkraft.com").publishOn('vm'),
        log: ko.observable().subscribeTo('vm')
    };
    ko.applyBindings(vm, document.getElementById('vm1'));
});