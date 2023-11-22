console.log("roshin");
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById("myForm");
    console.log("Form element found:", form);

    var errorName = document.getElementById("errorName");
    var errorPasword = document.getElementById("")
    console.log("Error name element found:", errorName);

    var errorMno = document.getElementById("errorMno"); // Add this line
    console.log("Error mobile element found:", errorMno); // Add this line

    form.addEventListener("submit", function(event) {
        console.log("hyyy");
        var nameInput = document.getElementsByName("name")[0];
        var emailInput = document.getElementsByName("email")[0];
        var mobileInput = document.getElementsByName("mno")[0]; // Add [0] to access the first element
        var passwordInput = document.getElementsByName("password")[0];

        var name = nameInput.value;
        var email = emailInput.value;
        var mno = mobileInput.value;
        var password = passwordInput.value;

        var nameValid = name.length >= 4;
        var emailValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
        var mobileValid = mno.length >= 10;
        var passwordValid = password.length >= 4;

        // Reset error display for each validation check
        errorName.style.display = "none";
        errorMno.style.display = "none";

        // Validate name
        if (!nameValid) {
            console.log("rr");
            errorName.style.display = "block";
            event.preventDefault();
        } else {
            console.log("rr");
            errorName.style.display = "block";
        }

        // Validate email
        if (!emailValid) {
            errorName.style.display = "block";
            event.preventDefault();
        }

        // Validate mobile
        if (!mobileValid) {
            errorMno.style.display = "block";
            event.preventDefault();
        } else {
            errorMno.style.display = "none";
        }

        // Validate password
        if (!passwordValid) {
            errorPasword.style.display = "block";
            event.preventDefault();
        } else {
            errorName.style.display = "none";
     }});
});