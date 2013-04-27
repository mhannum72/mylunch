// Height of my nomeal picture.  This is dumb: it should be a tunable within the picturegrid & carousel
var NOMEALHEIGHT = 256;

// TODO - clean this up
var MEALINFO = (function() {

    var NOMEAL = 0;
    var BREAKFAST = 1;
    var LUNCH = 2;
    var DINNER = 3;
    var SNACK = 4;
    var OTHER = 5;
    var MAXMEAL = 99;

    // Return constant given a string
    function mealToConst(meal)
    {
        if(meal == undefined || !meal)
        {
            return NOMEAL;
        }
        if(meal == "breakfast")
        {
            return BREAKFAST;
        }
        if(meal == "lunch")
        {
            return LUNCH;
        }
        if(meal == "dinner")
        {
            return DINNER;
        }
        if(meal == "snack")
        {
            return SNACK;
        }
        if(meal == "other")
        {
            return OTHER;
        }
        throw new Error("Invalid mealConst: " + meal);
    }

    // Utility function
	function mealDateToDate(mealdate)
	{
	    var year = mealdate / 1000000; mealdate %= 1000000;
	    var month = mealdate /  10000; mealdate %=   10000;
	    var day  = mealdate /     100;
	    return new Date(year, month-1, day);
	}

    function dateToMealDate(date, mealconst)
    {
        return  (date.getFullYear()    * 1000000) +
                ((date.getMonth() + 1)   * 10000) +
                (date.getDate()            * 100) +
                (mealconst);
    }

    return {
        dateToMealDate  : dateToMealDate,
        mealDateToDate  : mealDateToDate,
        mealToConst     : mealToConst,
        NOMEAL          : NOMEAL,
        BREAKFAST       : BREAKFAST,
        LUNCH           : LUNCH,
        DINNER          : DINNER,
        SNACK           : SNACK,
        OTHER           : OTHER,
        MAXMEAL         : MAXMEAL
    };
}());

