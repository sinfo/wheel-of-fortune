<?php
  require('../db/connect.php');

  if(isset($_POST['prize'])) {
    $prize = $_POST['prize'];
    
    $date = date('y-m-d');
    mysqli_query($db_conx, "INSERT INTO sinfo26_prizesgiven (date, prize) VALUES ( '$date', '$prize') ");
    mysqli_query($db_conx, "UPDATE sinfo26_prizes SET times_given = times_given + 1 WHERE prize = '" . $_POST['prize'] . "' AND day = '" . $date . "' ");
    
    echo 'sucess';
  }
?>
