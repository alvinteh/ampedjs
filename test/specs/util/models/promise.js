define(function() {
    var Am = window.Am;

    Am.Module.load("Util").then(function() {
        var Promise = Am.Module.get("Util").Promise;

        describe("Am", function() {
            describe("Util", function() {
                describe("Promise", function() {

                    it("should be defined", function(done) {
                        expect(Promise).to.exist;

                        done();
                    });

                    describe("Promise()", function() {
                        it("should return a Promise based on the provided function", function(done) {
                            var assertionCount = 2;
                            var completedCount = 0;
                            var notify = function() {
                                if (++completedCount === assertionCount) {
                                    done();
                                }
                            };

                            var promise1 = new Promise(function(fulfillCallback, rejectCallback) {
                                fulfillCallback("value");
                            });

                            expect(promise1).to.become("value").and.notify(notify);

                            var promise2 = new Promise(function(fulfillCallback, rejectCallback) {
                                rejectCallback(new Error("error"));
                            });

                            expect(promise2).to.be.rejected.and.notify(notify);
                        });
                    });

                    describe("::convert()", function() {
                        it("should convert the specified function to use promises", function(done) {
                            var convertedFunction = Promise.convert(function(errorCallback, fulfillCallback, value) {
                                setTimeout(function() {
                                    fulfillCallback(value + 1);
                                }, 50);
                            });

                            expect(convertedFunction(1)).to.become(2).and.notify(done);
                        });
                    });

                    describe("instance.then()", function() {
                        it("should execute the success callback when the promise is resolved", function(done) {
                            var promise = new Promise();

                            expect(promise).to.become("value").and.notify(done);

                            promise.resolve("value");
                        });

                        it("should execute the reject callback when the promise is rejected", function(done) {
                            var promise = new Promise();

                            expect(promise).to.eventually.be.rejected.and.notify(done);

                            promise.reject(new Error("error"));
                        });

                        it("should execute the reject callback when the promise is being resolved by itself",
                            function(done) {
                            var promise = new Promise();

                            promise.then(function() {
                                done("expected promise to be rejected as self-resolution should be disallowed");
                            }, function() {
                                done();
                            });

                            promise.resolve(promise);
                        });

                        it("should ignore the passed argument if it is invalid", function(done) {
                            var promise = new Promise();
                            var invalidPromise = "invalid";

                            expect(promise.then(invalidPromise)).to.become("value").and.notify(done);

                            promise.resolve("value");
                        });

                        it("should execute the success callback when the promise is already resolved", function(done) {
                            var promise1 = new Promise();
                            var promise2 = new Promise();
                            promise1.resolve("value");
                            promise2.resolve(promise1);

                            expect(promise1).to.become("value").and.notify(done);
                        });

                        it("should be interoperable with \"crafted\" promise objects which resolve", function(done) {
                            var promise = new Promise();
                            var craftedPromise = {
                                then: function(fulfillCallback) {
                                    setTimeout(function() {
                                        fulfillCallback("value");
                                    }, 50);
                                }
                            };

                            expect(promise).to.become("value").and.notify(done);

                            promise.resolve(craftedPromise);
                        });

                        it("should be interoperable with \"crafted\" promise objects which reject", function(done) {
                            var promise = new Promise();
                            var craftedPromise = {
                                then: function(fulfillCallback, rejectCallback) {
                                    setTimeout(function() {
                                        rejectCallback(new Error("error"));
                                    }, 50);
                                }
                            };

                            expect(promise).to.be.rejected.and.notify(done);

                            promise.resolve(craftedPromise);
                        });

                        it("should allow chaining of promises", function(done) {
                            var assertionCount = 3;
                            var completedCount = 0;
                            var notify = function() {
                                if (++completedCount === assertionCount) {
                                    done();
                                }
                            };

                            var test1 = function(value) {
                                var promise = new Promise();

                                setTimeout(function() {
                                    promise.resolve(value + 2);
                                }, 50);

                                return promise;
                            };

                            var test2 = function(value) {
                                var promise = new Promise();

                                setTimeout(function() {
                                    promise.resolve(value + 4);
                                }, 50);

                                return promise;
                            };

                            var test3 = function(value) {
                                return value;
                            };

                            var testError = function(value) {
                               var promise = new Promise();

                                setTimeout(function() {
                                    promise.reject(new Error("error"));
                                }, 50);

                                return promise;
                            };

                            var promise1 = new Promise();

                            expect(promise1.then(test1).then(test2).then(test3)).to.become(7).and.notify(notify);

                            promise1.resolve(1);

                            var promise2 = new Promise();

                            expect(promise2.then(test1).then(test2).then(testError)).to.be.rejected.and.notify(notify);

                            promise2.resolve(1);

                            var promise3 = new Promise();

                            expect(promise3.then(test1).then(testError).then(test2)).to.be.rejected.and.notify(notify);

                            promise3.resolve(1);
                        });
                    });
                });
            });
        });
    });

});
