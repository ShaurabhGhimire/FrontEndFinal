document.addEventListener("DOMContentLoaded", () => {
	// Element references
	const expenseForm = document.getElementById("expense-form");
	const categorySelect = document.getElementById("category");
	const subscriptionDetails = document.getElementById("subscription-details");
	const subscriptionList = document.getElementById("subscription-list");
	const budgetDisplay = document.getElementById("budget-amount");
	const updateBudgetBtn = document.getElementById("update-budget");
	const spendingChartCtx = document.getElementById("spending-chart").getContext("2d");
	const timeFilter = document.getElementById("time-filter");

	// Local storage data
	const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
	const subscriptions = JSON.parse(localStorage.getItem("subscriptions")) || [];
	let budget = JSON.parse(localStorage.getItem("budget")) || 0;

	// Initialize Chart.js
	const chart = new Chart(spendingChartCtx, {
		type: "pie",
		data: {
			labels: [],
			datasets: [
				{
					label: "Spending per Category",
					data: [],
					backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4CAF50", "#ffa500", "#8a2be2"],
				},
			],
		},
	});

	// Group expenses by time period
	const groupExpensesByPeriod = (period) => {
		const groupedExpenses = {};
		const now = new Date();

		expenses.forEach((expense) => {
			const expenseDate = new Date(expense.date);
			const category = expense.category;

			let isInPeriod = false;

			if (period === "daily") {
				isInPeriod = expenseDate.toDateString() === now.toDateString();
			} else if (period === "weekly") {
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);
				isInPeriod = expenseDate >= weekStart && expenseDate <= weekEnd;
			} else if (period === "monthly") {
				isInPeriod = expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
			}

			if (isInPeriod) {
				groupedExpenses[category] = (groupedExpenses[category] || 0) + expense.amount;
			}
		});

		return groupedExpenses;
	};

	// Update the chart
	const updateChart = (period = "weekly") => {
		const groupedExpenses = groupExpensesByPeriod(period);

		chart.data.labels = Object.keys(groupedExpenses);
		chart.data.datasets[0].data = Object.values(groupedExpenses);
		chart.update();
	};

	// Render subscriptions
	const renderSubscriptions = () => {
		subscriptionList.innerHTML = subscriptions
			.map(
				(sub, index) =>
					`<div class="subscription-card">
			  <h3>${sub.name}</h3>
			  <p>Price: $${sub.price}</p>
			  <p>Frequency: ${sub.frequency}</p>
			  <button data-index="${index}" class="delete-subscription">Delete</button>
			</div>`
			)
			.join("");
	};

	// Save data to localStorage
	const saveToLocalStorage = () => {
		localStorage.setItem("expenses", JSON.stringify(expenses));
		localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
		localStorage.setItem("budget", JSON.stringify(budget));
	};

	// Form submission
	expenseForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const amount = +document.getElementById("amount").value;
		const category = categorySelect.value;
		const date = document.getElementById("date").value;

		// Handle subscriptions
		if (category === "Subscriptions") {
			const subName = document.getElementById("subscription-name").value;
			const subFrequency = document.getElementById("subscription-frequency").value;

			subscriptions.push({ name: subName, price: amount, frequency: subFrequency });
			renderSubscriptions();
			subscriptionDetails.style.display = "none";
		}

		// Add expense
		expenses.push({ amount, category, date });
		saveToLocalStorage();
		updateChart();
		expenseForm.reset();
	});

	// Update budget
	updateBudgetBtn.addEventListener("click", () => {
		const newBudget = prompt("Enter new weekly budget:");
		if (newBudget) {
			budget = +newBudget;
			budgetDisplay.textContent = `$${budget}`;
			saveToLocalStorage();
		}
	});

	// Show/hide subscription details
	categorySelect.addEventListener("change", (e) => {
		if (e.target.value === "Subscriptions") {
			subscriptionDetails.style.display = "block";
		} else {
			subscriptionDetails.style.display = "none";
		}
	});

	// Delete subscription
	subscriptionList.addEventListener("click", (e) => {
		if (e.target.classList.contains("delete-subscription")) {
			const index = e.target.dataset.index;
			subscriptions.splice(index, 1);
			saveToLocalStorage();
			renderSubscriptions();
		}
	});

	// Filter chart by time period
	timeFilter.addEventListener("change", (e) => {
		updateChart(e.target.value);
	});

	// Integrate Flatpickr for improved date input
	flatpickr("#date", {
		dateFormat: "Y-m-d",
		defaultDate: new Date(),
	});

	// Initial load
	budgetDisplay.textContent = `$${budget}`;
	updateChart();
	renderSubscriptions();
});
