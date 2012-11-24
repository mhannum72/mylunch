<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <title>Save Comment</title>
    </head>
    <body>
        <form method="post" action="SaveComment.php">
            <p>Please enter your comments.</p>
            <table border="0">
                <tr>
                    <td><label for="txtName">Name</label></td>
                    <td><input type="text" name="txtName" id="txtName" /></td>
                </tr>
                <tr>
                    <td><label for="txtMessage">Message</label></td>
                    <td><textarea rows="7" cols="35" name="txtMessage" id="txtMessage"></textarea></td>
                </tr>
            </table>
            <input type="submit" value="Post Comment" />
        </form>
    </body>
</html>
