// JavaScript to handle adding reminders

let editingCard = null; // Track the card being edited
let cardToDelete = null; // Track the card to delete

// Save reminders to localStorage
function saveRemindersToLocalStorage() {
    const reminders = [];
    document.querySelectorAll('.reminder-list .card').forEach(card => {
        const name = card.querySelector('.card-title').textContent;
        const dateTime = card.querySelector('.card-text em').getAttribute('data-iso');
        reminders.push({ name, dateTime });
    });
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Function to sort reminders by date or name
function sortReminders() {
    const reminderList = document.querySelector('.reminder-list');
    const cards = Array.from(reminderList.querySelectorAll('.card'));
    const sortOption = document.getElementById('sortOptions').value;

    cards.sort((a, b) => {
        if (sortOption === 'date') {
            // Parse dates from data-iso attribute
            const dateA = Date.parse(a.querySelector('.card-text em').getAttribute('data-iso'));
            const dateB = Date.parse(b.querySelector('.card-text em').getAttribute('data-iso'));

            // Handle invalid dates
            if (isNaN(dateA) || isNaN(dateB)) {
                console.error("Invalid date format detected during sorting:", {
                    dateA: a.querySelector('.card-text em').getAttribute('data-iso'),
                    dateB: b.querySelector('.card-text em').getAttribute('data-iso')
                });
                return 0; // Keep the order unchanged if dates are invalid
            }

            return dateA - dateB; // Ascending order by date
        } else if (sortOption === 'name') {
            // Compare names alphabetically
            const nameA = a.querySelector('.card-title').textContent.trim().toLowerCase();
            const nameB = b.querySelector('.card-title').textContent.trim().toLowerCase();
            return nameA.localeCompare(nameB); // Alphabetical order by name
        }
    });

    // Clear the list and re-append sorted cards
    reminderList.innerHTML = '';
    cards.forEach(card => reminderList.appendChild(card));
}

// Event listener for sorting dropdown
document.getElementById('sortOptions').addEventListener('change', sortReminders);

// Handle delete confirmation modal
function showDeleteConfirmation(card) {
    cardToDelete = card; // Store the card to delete
    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = mdb.Modal.getInstance(modalElement) || new mdb.Modal(modalElement);
    modal.show();
}

document.getElementById('confirmDeleteButton').addEventListener('click', function() {
    if (cardToDelete) {
        cardToDelete.remove();
        saveRemindersToLocalStorage();
        cardToDelete = null; // Clear the reference
    }
    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = mdb.Modal.getInstance(modalElement);
    modal.hide();
});

// Add fade-out effect before removing a reminder
function removeReminderWithFade(card) {
    card.classList.add('fade-out');
    setTimeout(() => {
        card.remove();
        saveRemindersToLocalStorage();
    }, 500); // Match the duration of the fade-out effect
}

// Confirmation before deleting a reminder
function removeReminderWithConfirmation(card) {
    showDeleteConfirmation(card);
}

// Function to safely convert a date string to ISO format for datetime-local input
function getISOStringForInput(dateString) {
    try {
        // Try to parse the date string
        const date = new Date(dateString);
        
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DDThh:mm
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        // If date parsing fails, use current date/time
        console.error("Invalid date format:", dateString);
        const now = new Date();
        return now.toISOString().slice(0, 16);
    } catch (error) {
        console.error("Error processing date:", error);
        // Default to current date/time if there's an error
        const now = new Date();
        return now.toISOString().slice(0, 16);
    }
}

// Format date in a natural language way
function formatDateNatural(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const isTomorrow = date.getDate() === tomorrow.getDate() && 
                       date.getMonth() === tomorrow.getMonth() && 
                       date.getFullYear() === tomorrow.getFullYear();
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    
    if (isToday) {
        return `Today at ${timeStr}`;
    } else if (isTomorrow) {
        return `Tomorrow at ${timeStr}`;
    } else {
        const options = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleDateString('en-US', options);
    }
}

// Load reminders from localStorage and sort them
function loadRemindersFromLocalStorage() {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const reminderList = document.querySelector('.reminder-list');
    reminders.forEach(reminder => {
        const card = document.createElement('div');
        card.className = 'card mt-3';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${reminder.name}</h5>
                <p class="card-text">
                    <em data-iso="${reminder.dateTime}">${formatDateNatural(reminder.dateTime)}</em>
                </p>
                <button class="btn btn-danger btn-sm delete-reminder">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
                <button class="btn btn-primary btn-sm edit-reminder">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        reminderList.appendChild(card);

        // Add delete functionality
        card.querySelector('.delete-reminder').addEventListener('click', function() {
            showDeleteConfirmation(card);
        });

        // Add edit functionality
        card.querySelector('.edit-reminder').addEventListener('click', function() {
            const currentName = card.querySelector('.card-title').textContent;
            const currentDateTime = card.querySelector('.card-text em').getAttribute('data-iso');
            document.getElementById('reminderName').value = currentName;
            document.getElementById('reminderDateTime').value = getISOStringForInput(currentDateTime);
            editingCard = card;
            const modal = new mdb.Modal(document.getElementById('addReminderModal'));
            modal.show();
        });
    });
    sortReminders(); // Sort reminders after loading
}

// Update save functionality to include sorting
const saveButton = document.getElementById('saveReminder');
saveButton.addEventListener('click', function() {
    const name = document.getElementById('reminderName').value;
    const dateTime = document.getElementById('reminderDateTime').value;

    if (name && dateTime) {
        if (editingCard) {
            // Update the existing card
            editingCard.querySelector('.card-title').textContent = name;
            editingCard.querySelector('.card-text em').setAttribute('data-iso', dateTime);
            editingCard.querySelector('.card-text em').textContent = formatDateNatural(dateTime);
            editingCard = null;
        } else {
            // Create a new card
            const reminderList = document.querySelector('.reminder-list');
            const card = document.createElement('div');
            card.className = 'card mt-3';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${name}</h5>
                    <p class="card-text">
                        <em data-iso="${dateTime}">${formatDateNatural(dateTime)}</em>
                    </p>
                    <button class="btn btn-danger btn-sm delete-reminder">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                    <button class="btn btn-primary btn-sm edit-reminder">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            `;
            reminderList.appendChild(card);

            // Add delete functionality
            card.querySelector('.delete-reminder').addEventListener('click', function() {
                showDeleteConfirmation(card);
            });

            // Add edit functionality
            card.querySelector('.edit-reminder').addEventListener('click', function() {
                const currentName = card.querySelector('.card-title').textContent;
                const currentDateTime = card.querySelector('.card-text em').getAttribute('data-iso');
                document.getElementById('reminderName').value = currentName;
                document.getElementById('reminderDateTime').value = getISOStringForInput(currentDateTime);
                editingCard = card;
                const modal = new mdb.Modal(document.getElementById('addReminderModal'));
                modal.show();
            });
        }

        // Save to localStorage, sort reminders, and clear form
        saveRemindersToLocalStorage();
        sortReminders(); // Sort reminders after saving
        document.getElementById('reminderName').value = '';
        document.getElementById('reminderDateTime').value = '';
        const modal = mdb.Modal.getInstance(document.getElementById('addReminderModal'));
        modal.hide();
    } else {
        alert('Please fill out all fields before saving.');
    }
});

// Initialize MDB components
document.addEventListener('DOMContentLoaded', function() {
    // Ensure dark theme is applied by default
    document.body.classList.add('dark-theme');
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements (inputs, textareas, etc.)
    document.querySelectorAll('.form-outline').forEach(formOutline => {
        new mdb.Input(formOutline).init();
    });

    // Apply the saved theme on page load
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.classList.add(savedTheme);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.reminder-list .card').forEach(card => {
            const name = card.querySelector('.card-title').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Update button classes for vibrant colors
    document.querySelectorAll('.btn-success').forEach(btn => btn.classList.add('btn-success'));
    document.querySelectorAll('.btn-danger').forEach(btn => btn.classList.add('btn-danger'));

    // Load reminders from localStorage
    loadRemindersFromLocalStorage();

    // Initialize modals on page load
    const addReminderModal = document.getElementById('addReminderModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    new mdb.Modal(addReminderModal);
    new mdb.Modal(confirmDeleteModal);
});