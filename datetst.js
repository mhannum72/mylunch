//
//
// Given a date object and a meal const, format to YYYYMMDDmm
function dateToMealDate(date, mealconst)
{
    if(mealconst < 0 || mealconst > 99)
    {
        throw new Error("Invalid value for mealconst(" + mealconst + ".  Must be between 0 and 99");
        return;
    }

    return (               // YYYYMMDDmm
        (date.getFullYear()    * 1000000) +
        ((date.getMonth() + 1)   * 10000) +
        (date.getDate()            * 100) +
        (mealconst)
    );
}

// Given YYYYMMDDmm, return a date object corresponding to YYYYMMDD
// I might not need this
function mealDateToDate(mealdate)
{
    var year = mealdate / 1000000; mealdate %= 1000000;
    var month = mealdate /  10000; mealdate %=   10000;
    var day  = mealdate /     100;
    return new Date(year, month - 1, day);
}

var now = new Date();
var val = dateToMealDate(now, 1);
var tst = 2011010105;
console.log('now is ' + val);

var newMealDate = (tst - (tst % 100)) + 9;

var mealdate = mealDateToDate(tst);
console.log('mealdate year is:' + mealdate.getFullYear());
console.log('mealdate month is:' + mealdate.getMonth() + 1);
console.log('mealdate day is:' + mealdate.getDate());
console.log('tst is:' + tst);
console.log('newmealdate is:' + newMealDate);

