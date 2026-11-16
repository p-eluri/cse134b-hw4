
const form = document.querySelector("form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const commentsInput = document.querySelector("#comments");
const characterCount = document.querySelector("#character-count");

const fields = [nameInput, emailInput, commentsInput];
const characterLimit = commentsInput.maxLength;
const warningThreshold = 100;

// Keep a history of errors from failed submission attempts.
const form_errors = [];

let attemptedSubmit = false;
const editedFields = new Set();
const blurredFields = new Set();

// Create the information area for the character counter.
const infoArea = document.createElement("section");
infoArea.id = "form-info-area";

const infoHeading = document.createElement("h2");
infoHeading.textContent = "Message information";

infoArea.appendChild(infoHeading);
infoArea.appendChild(characterCount);

// Create the error message area.
const errorArea = document.createElement("section");
errorArea.id = "form-error-area";
errorArea.hidden = true;
errorArea.setAttribute("aria-live", "polite");
errorArea.setAttribute("aria-atomic", "true");

const errorHeading = document.createElement("h2");
errorHeading.textContent = "Form errors";
errorArea.appendChild(errorHeading);

const errorMessages = new Map();

for (const field of fields) {
    const errorMessage = document.createElement("p");
    errorMessage.id = `${field.id}-error`;
    errorMessage.hidden = true;

    errorArea.appendChild(errorMessage);
    errorMessages.set(field, errorMessage);

    field.setAttribute("aria-describedby", errorMessage.id);
}

// Place both message areas below the form fields.
const submitButton = form.querySelector('button[type="submit"]');

form.insertBefore(errorArea, submitButton);
form.insertBefore(infoArea, submitButton);

// Add the hidden field for serialized error history.
const errorHistoryInput = document.createElement("input");
errorHistoryInput.type = "hidden";
errorHistoryInput.name = "form-errors";
errorHistoryInput.value = "[]";
form.appendChild(errorHistoryInput);

// Update the live character counter.
function updateCharacterCount() {
    const remaining = characterLimit - commentsInput.value.length;

    if (remaining === 0) {
        characterCount.textContent =
            `Character limit reached (${characterLimit} characters).`;
        characterCount.className = "character-warning";
    } else if (remaining <= warningThreshold) {
        characterCount.textContent =
            `Warning: Only ${remaining} characters remaining!`;
        characterCount.className = "character-warning";
    } else {
        characterCount.textContent =
            `${remaining} characters remaining`;
        characterCount.className = "";
    }
}

// Determine the correct validation message for a field.
function getValidationMessage(field) {
    // Clear the old message before checking the new validity.
    field.setCustomValidity("");

    const validity = field.validity;

    let message = "";

    if (validity.valueMissing) {
        message = `${field.name} is required.`;
    } else if (validity.typeMismatch) {
        message = "Please enter a valid email address.";
    } else if (validity.tooShort) {
        message =
            `${field.name} must contain at least ${field.minLength} characters.`;
    } else if (validity.tooLong) {
        message =
            `${field.name} must contain no more than ${field.maxLength} characters.`;
    } else if (!validity.valid) {
        message = field.validationMessage;
    }

    field.setCustomValidity(message);

    return message;
}

// Update the visible errors without recording history.
function updateErrorDisplay() {
    let visibleErrors = 0;

    for (const field of fields) {
        const message = getValidationMessage(field);
        const errorElement = errorMessages.get(field);

        const shouldShow =
            attemptedSubmit || blurredFields.has(field);

        if (message && shouldShow) {
            errorElement.textContent =
                `${field.name}: ${message}`;
            errorElement.hidden = false;
            visibleErrors++;
        } else {
            errorElement.textContent = "";
            errorElement.hidden = true;
        }
    }

    errorArea.hidden = visibleErrors === 0;
}

// Update validation while users edit the fields.
for (const field of fields) {
    field.addEventListener("input", function () {
        editedFields.add(field);

        if (field === commentsInput) {
            updateCharacterCount();
        }

        updateErrorDisplay();
    });

    field.addEventListener("blur", function () {
        if (editedFields.has(field)) {
            blurredFields.add(field);
            updateErrorDisplay();
        }
    });
}

// Capture native validation failures, including Enter-key submissions.
form.addEventListener("invalid", function (event) {
    const field = event.target;

    if (!fields.includes(field)) {
        return;
    }

    attemptedSubmit = true;

    const message = getValidationMessage(field);

    // Record one entry for this invalid field event.
    form_errors.push({
        field: field.name,
        message: message
    });

    updateErrorDisplay();
}, true);

// Serialize history before a successful native POST submission.
form.addEventListener("submit", function () {
    errorHistoryInput.value = JSON.stringify(form_errors);
});

// Activate the character counter.
characterCount.hidden = false;
updateCharacterCount();
updateErrorDisplay();
