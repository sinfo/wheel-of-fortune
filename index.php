<?php
  require('db/connect.php');

  $date = date('y-m-d');
  $prizes = mysqli_query($db_conx, "SELECT * FROM sinfo26_prizes WHERE day = '$date' ");

  while($prize = mysqli_fetch_array($prizes, MYSQLI_ASSOC)) { $prizes_list[] = $prize; }
?>

<!DOCTYPE html>
<html >
  <head>
    <meta charset="UTF-8">
    <title>Lucky Wheel</title>
    
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <script src="https://code.jquery.com/jquery-1.12.4.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script> 
    <script type="text/javascript">
      <?php 
        // Structure data into a more JS Object type
        $prizes_track_list = (object)[];

        foreach ($prizes_list as $key => $prize) {
          $prizes_track_list->{$prize['prize']} = $prize;
        }

        $prizes_track_list->try_again = (object)[];
        $prizes_track_list->try_again->colour = '#fff';
        $prizes_track_list->try_again->prize = 'try_again';
      ?>

      // Convert to JSON
      var prizes_track = <?php echo json_encode($prizes_track_list) ?>

      var prizes_pos = {
        0: prizes_track['fnac_card'],
        1: prizes_track['anti-stress_ball'],
        2: prizes_track['bottle_opener'],
        3: prizes_track['t-shirt'],
        4: prizes_track['bag'],
        5: prizes_track['mug'],
        6: prizes_track['mouse_mat'],
        7: prizes_track['bottle_opener'],
        8: prizes_track['lanyard'],
        9: prizes_track['car_support'],
        10: prizes_track['powerbank'],
        11: prizes_track['try_again'],
        12: prizes_track['anti-stress_ball'],
        13: prizes_track['bottle_opener'],
        14: prizes_track['t-shirt'],
        15: prizes_track['bag'],
        16: prizes_track['mug'],
        17: prizes_track['mouse_mat'],
        18: prizes_track['bottle_opener'],
        19: prizes_track['lanyard'],
        20: prizes_track['car_support'],
        21: prizes_track['powerbank'],
      }
    </script>
  </head>

  <body>
    <div class='header'>
      <img src="img/logo-sinfo.png" alt="SINFO 25" class='SINFO-logo' />
    </div>
    <div id="container" class="centered">
      <div class="title">
        Lucky Wheel
      </div>
      <div id="dialog-confirm" title="Confirm prize">
        <select id='confirmBox'>
          <?php
            foreach ($prizes_list as $key => $prize) {
              echo "<option value='" . $prize['prize'] . "'>" . $prize['name']. "</option>";
            }
          ?>
        </select> 
      </div>
      <canvas id="drawing_canvas"></canvas>
      <p class="bubble speech" id="status_speech"></p>
      <p class="bubble thought" id="status_tought">hum .. this is going to win</p>
      <img src="img/Hacky26.png" alt="hacky" class='Hacky' />
      <table class="table prizes">
        <thead>
          <tr><th colspan="2">Prize List</th></tr>
        </thead>
        <tbody>
          <?php
            foreach ($prizes_list as $key => $prize) {
              $state = $prize['times_given'] >= $prize['quantity'] ? 'disable' : 'enable';
              
              echo "<tr>";
              echo "<td style='background-color: " . $prize['colour'] . "' ></td>";
              echo "<td class='" . $state . "' id='" . $prize['prize'] . "' >" . $prize['name'] . "</td>";
              echo "</tr>";
            }
          ?>
          <tr><td style="background-color: #"></td><td id="white">Try again</td></tr>
        </tbody>
      </table>
      
      <button class="btn btn-outline-primary" id="rodar"> Spin </button>
      <button class="btn btn-info" id="confirm">Confirm prize</button>
    </div>
    <div class="footer">
      Made with ♥ at SINFO
    </div>

    <script src="http://cdnjs.cloudflare.com/ajax/libs/p2.js/0.6.0/p2.min.js"></script>

    <script src="js/index.js"></script>
  </body>
</html>
