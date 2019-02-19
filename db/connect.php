<?php
	$db_conx = mysqli_connect("server","user","pass","database");
	// Evaluate the connection
	if (mysqli_connect_errno()){
		echo mysqli_connect_error();
		exit();
	}
?>