// BUDGET CONTROLLER (data)
var budgetController = (function(){

	var Expense = function(id, description, value){
		this.id = id;
		this.description = description;
		this.value = value;
        this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function(totalIncome){
		if (totalIncome > 0){
			this.percentage = Math.round((this.value / totalIncome) * 100);
		}
		else{
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

	var Income = function(id, description, value){
		this.id = id;
		this.description = description;
		this.value = value;
	};

	var calculateTotal = function(type){
		var sum = 0;

		data.allItems[type].forEach(function(cur){
			sum += cur.value;
		});
		data.totals[type] = sum;
	};

	// global data bundle
	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1 // set to -1 to indicate not exist
	};

	return {
		addItem: function(type, des, val) {
			var newItem, ID;

			//[1 2 3 4 5], next ID = 6
			//[1 2 4 6 8], next ID = 9
			// ID = last ID + 1

			// Create new ID
			if (data.allItems[type].length > 0){
				// ID should be last ID + 1 to avoid conflicts
				ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
			}
			else{
				ID = 0;
			}
			
			// Create new item based on 'inc' or 'exp' type
			if (type === 'exp'){
				newItem = new Expense(ID, des, val);
			}
			else if (type === 'inc'){
				newItem = new Income(ID, des, val);
			}

			// Push into our data structure
			data.allItems[type].push(newItem);

			// Return new element
			return newItem;
		},

		deleteItem: function(type, id){
			var ids, index;

			// Map: like an array but returns brand new array
			ids = data.allItems[type].map(function(current){
				return current.id;
			});

			index = ids.indexOf(id);

			// remove
			if (index !== -1){
				data.allItems[type].splice(index, 1);
			}
		},

		deleteAll: function(type){
			var i = data.allItems[type].length;

			data.allItems[type].splice(0, i);
		},

		calculateBudget: function() {
			// Calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');

			// Calculate budget: income - expenses
			data.budget = data.totals.inc - data.totals.exp;

			// Calculate percentage of income we spent
			if (data.totals.inc > 0){
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			}
			else{
				data.percentage = -1;
			}
			
		},

		calculatePercentages: function() {
            
            /*
            a=20
            b=10
            c=40
            income = 100
            a=20/100=20%
            b=10/100=10%
            c=40/100=40%
            */
            
            data.allItems.exp.forEach(function(cur) {
               cur.calcPercentage(data.totals.inc);
            });
        },

		getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return allPerc;
        },

		getBudget: function(){
			return{
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		},

		testing: function(){
			console.log(data);
		}
	}
})();

// UI CONTROLLER
var UIController = (function(){

	// Collection of DOM strings for app
	var DOMstrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expensesContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expensesLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercLabel: '.item__percentage',
		dateLabel: '.budget__title--month',
		allDeleteBtn: '.delete__all--btn',
		deleteAllContainer: '.delete-all'
	};

	// formats all nums to: +/- 0,000.00
	var formatNumber = function(num, type){
		var numSplit, int, dec, type;
		/*
		+ or - before number
		exactly 2 decimal places
		comma seperating thousands
		*/

		num = Math.abs(num);
		// round to exactly 2; converts to obj to use method
		num = num.toFixed(2);

		numSplit = num.split('.');

		// whole num
		int = numSplit[0];

		// inserts , to seperate nums
		if (int.length > 3){
			int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length);
		}

		// decimal
		dec = numSplit[1];

		// add + - sign in front of num
		if (type == 'none'){
			return int + '.' + dec;
		}
		
		return (type === 'exp' ? sign = '-': sign = '+') + ' ' + int + '.' + dec;
	};

	// call callback function
	var nodeListForEach = function(list, callback){
		for (var i = 0; i < list.length; i++){
			callback(list[i], i);
		}
	};

	return {
		// gets values from input fields
		getInput: function() {
			return{
				type: document.querySelector(DOMstrings.inputType).value, // inc or exp
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
			}
		},

		// add new inc/exp item
		addListItem: function(obj, type){
			var html, newHtml, element;

			// Create HTML string with placeholer text
			// income
			if (type === 'inc'){
				element = DOMstrings.incomeContainer;
				html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
			}
			// expense
			else if (type === 'exp'){
				element = DOMstrings.expensesContainer;
				html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
			}
			
			// Replace placeholder text with some actual text
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%description%', obj.description);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

			// Insert HTML into DOM
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
		},

		// delete inc/exp list item
		deleteListItem: function(selectorID){
			var el = document.getElementById(selectorID);
			el.parentNode.removeChild(el);
		},

		removeAll: function() {
            document.querySelector(DOMstrings.incomeContainer).innerHTML = '';
            document.querySelector(DOMstrings.expensesContainer).innerHTML = '';
        },

		// clear all input fields
		clearFields: function(){
			var fields, fieldsArr;

			fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

			// Select all fields and put in array
			fieldsArr = Array.prototype.slice.call(fields);

			// Clear all fields in array
			fieldsArr.forEach(function(current, index, array){
				current.value = "";
			});

			fieldsArr[0].focus();
		},

		// update top labels: budget, income, exp, and %
		displayBudget: function(obj){
			var type;
			obj.budget > 0 ? type = 'inc' : type = 'exp';
			if (obj.budget === 0){
				type = 'none';
			}

			document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
			document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
			document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
			
			// display percent(top) if more than 0/not null
			if(obj.percentage > 0) {
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
			}
			else{
				document.querySelector(DOMstrings.percentageLabel).textContent = '---';
			}
		},

		// display % in list item
		displayPercentages: function(percentages){
			var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

			nodeListForEach(fields, function(current, index){
				if (percentages[index] > 0){
					current.textContent = percentages[index] + '%';
				}
				else{
					current.textContent = '---';
				}
			});
		},

		// displays current date on top of app 
		displayMonth: function(){
			var now, months, month, year;

			now = new Date();

			months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();

			year = now.getFullYear();
			document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
		},

		// change color if exp or inc
		changedType: function(){
			var fields = document.querySelectorAll(
				DOMstrings.inputType + ',' +
				DOMstrings.inputDescription + ',' +
				DOMstrings.inputValue);

			nodeListForEach(fields, function(cur) {
				cur.classList.toggle('red-focus');
			});

			//change button color
			document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
		},

		// Gets DOM - Allows usage of strings in other places
		getDOMstrings: function() {
            return DOMstrings;
        }
	};
})();

// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl){

	var setupEventListeners = function() {
		// gets DOM strings and puts as neat variable
		var DOM = UICtrl.getDOMstrings();

		// When add button clicked
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

		// When enter/return key is pressed
		document.addEventListener('keypress', function(event){
			if(event.keyCode === 13 || event.which === 13){
				ctrlAddItem();
			}
		});

		document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
		document.querySelector(DOM.allDeleteBtn).addEventListener('click', deleteAll);
		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
	};

	var updateBudget = function() {
		// 1. Calculate budget
		budgetCtrl.calculateBudget();

		// 2. Return budget
		var budget = budgetCtrl.getBudget();

		// 3. Display the budget in UI
		UICtrl.displayBudget(budget);
	};

	var updatePercentages = function(){
		// 1. Calculate percentages
		budgetCtrl.calculatePercentages();

		// 2. Read percentages from budget controller
		var percentages = budgetCtrl.getPercentages();

		// 3. Update UI with new percentages
		UICtrl.displayPercentages(percentages);
	} 

	var ctrlAddItem = function(){
		var input, newItem;

		// 1. Get field input data
		input = UICtrl.getInput();

		// if description not empty, value not a NaN, and not less than 0
		if(input.description !== "" && !isNaN(input.value) && input.value > 0){
			// 2. Add item to budget controller
			newItem = budgetCtrl.addItem(input.type, input.description, input.value);

			//3. Add item to UI
			UICtrl.addListItem(newItem, input.type);

			// 4. Clear field
			UICtrl.clearFields();

			// 5. Calculate and update budget
			updateBudget();

			// 6. Calculate and update percentages
			updatePercentages();
		}
	};

	var ctrlDeleteItem = function(event){
		var itemID, splitID, type, ID;
		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

		if (itemID){
			// inc-1
			splitID = itemID.split('-');
			type = splitID[0];
			ID = parseInt(splitID[1]);

			// 1. Delete the item from data structure
			budgetCtrl.deleteItem(type, ID);

			// 2. Delete item from UI
			UICtrl.deleteListItem(itemID);

			// 3. Update and show new budget
			updateBudget();

			// 4. Calculate and update percentages
			updatePercentages();
		}
	};

	var deleteAll = function() 
	{
        budgetCtrl.deleteAll('inc');
        budgetCtrl.deleteAll('exp');
        UICtrl.removeAll();
 
        // 3. Update and show the new budget
        updateBudget();
            
        // 4. Calculate and update percentages
        updatePercentages();
    };

	// Initialize applications
	return {
		init: function(){
			UICtrl.displayMonth();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1});

			setupEventListeners();
		}
	};
})(budgetController, UIController);

controller.init();