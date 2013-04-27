// Create string format for dates
Date.prototype.asMyString = function() {
    var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
    return monthNames[this.getMonth()] + ' ' + this.getDate() + ', ' + this.getFullYear();
}

// Create string format for griddates
Date.prototype.asSlashString = function() {
    return (this.getMonth() + 1) + '/' + this.getDate() + '/' + this.getFullYear();
}

