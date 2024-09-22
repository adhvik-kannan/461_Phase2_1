//class to increment test count
//class to increment test count
export class TestCount {
    constructor() {
        this.testCount = 0;
        this.testPassed = 0;
    }

    incrementTestCount() {
        this.testCount += 1;
    }

    incrementTestPassed() {
        this.testPassed += 1;
    }
}

const _testCount = new TestCount();
export default _testCount;
// export class TestCount {
//      static testCount = 0;
//     private static testPassed = 0;

//     public static incrementTestCount() {
//         this.testCount++;
//     }

//     public static incrementTestPassed() {
//         this.testPassed++;
//     }

//     public printTestCount() {
//         console.log(TestCount.testPassed + "/" + TestCount.testCount + " tests passed.");
//     }
// }

// const _testCount = new TestCount();

// export default _testCount;
