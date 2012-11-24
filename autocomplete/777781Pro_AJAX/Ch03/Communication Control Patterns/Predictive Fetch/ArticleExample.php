<?php
    $page = 1;
    $dataOnly = false;
    if (isset($_GET["page"])) {
        $page = (int) $_GET["page"];
    }
    
    if (isset($_GET["dataonly"]) && $_GET["dataonly"] == "true") {
        $dataOnly = true;
    }

    if (!$dataOnly) {
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <title>Article Example</title>
        <script type="text/javascript" src="zxml.js"></script>
        <script type="text/javascript" src="Article.js"></script>
        <link rel="stylesheet" type="text/css" href="Article.css" />
    </head>
    <body>
        <h1>Article Title</h1>
        <div id="divLoadArea" style="display:none"></div>
<?php        
        $output = "<p>Page ";
        
        for ($i=1; $i < 4; $i++) {
            $output .= "<a href=\"ArticleExample.php?page=$i\" id=\"aPage$i\"";
            if ($i==$page) {
                $output .= "class=\"current\"";
            }
            $output .= ">$i</a> ";
        }
        
        echo $output;
        
    } //End: if(!$dataOnly)

    if ($page==1) {
?>
       <div id="divPage1">
       <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec interdum cursus risus. In pharetra commodo nunc. Pellentesque sapien mauris, placerat quis, condimentum eu, ultrices nec, arcu. Morbi et magna ac massa lobortis facilisis. Fusce molestie nulla sit amet arcu. Pellentesque sollicitudin, ligula vel auctor aliquam, enim nulla posuere lectus, id tincidunt enim lacus ac enim. Suspendisse luctus, arcu ut ultrices lobortis, dolor ante volutpat justo, et cursus nisi lectus a urna. Duis cursus tortor vel justo. Maecenas libero. Nam lacinia, eros ac facilisis congue, leo erat ultricies orci, in sodales ante nulla vel sem. Phasellus tincidunt. Quisque laoreet, pede ut accumsan rhoncus, diam arcu fringilla sem, ac commodo odio justo non ante. In eget ligula et sapien laoreet tempor. Vestibulum cursus dui. Integer egestas nulla sed nulla. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse consequat magna vel elit. Phasellus id sem eget nisi lobortis congue. Nullam vehicula pede et quam.
        </p>
        <p>
        Donec a nunc sed velit porttitor auctor. Quisque sapien augue, tincidunt pretium, laoreet sit amet, ultricies sit amet, neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In fringilla tristique est. Ut vel pede. Nulla nec urna ac leo commodo sagittis. Praesent convallis nisl eu dolor. Aenean faucibus ultrices nisi. Nulla risus libero, accumsan nec, iaculis quis, pretium sed, quam. Maecenas feugiat eleifend orci. Donec sed turpis ac ligula eleifend adipiscing. Nunc quis ipsum ac nunc hendrerit tincidunt. In nibh magna, sollicitudin nec, luctus ac, aliquam vel, erat.
        </p>
        <p>
        Nunc tempor pede condimentum enim. Cras ipsum enim, tristique et, suscipit vehicula, dapibus id, augue. Maecenas dui magna, iaculis in, tempor vitae, convallis sit amet, nunc. Nullam cursus, nunc a rutrum sagittis, enim diam venenatis ipsum, ut mollis ligula nunc vitae dui. Aliquam venenatis molestie turpis. Maecenas eleifend tincidunt orci. Proin pulvinar. Duis placerat libero at nulla. Cras quam. Etiam vitae quam eget neque semper dapibus. Mauris urna. Cras tellus dui, sodales vitae, tincidunt at, porttitor congue, nisi. Praesent venenatis augue quis ante. Donec vehicula arcu sit amet leo. Curabitur hendrerit. Cras quis lectus. Ut vitae nisi ac est pellentesque aliquet.
        </p>
        <p>
        
        Nam iaculis. Donec eget augue. Quisque ut urna. Pellentesque tincidunt aliquam dui. Integer lobortis est eget nisl. Curabitur malesuada ultricies sem. Praesent adipiscing. Fusce ultricies quam vitae nisi. Morbi interdum varius massa. Donec adipiscing, quam sed nonummy nonummy, nunc sem tincidunt metus, lacinia aliquet neque quam cursus mi. Nam vel sapien nec libero gravida hendrerit. Donec metus arcu, rhoncus ut, venenatis non, aliquam ac, urna. Curabitur tincidunt iaculis lacus. Vestibulum nonummy.
        </p>
        <p>
        Fusce tincidunt lectus eget dui. Praesent ac libero. Aliquam sem. Cras ipsum metus, malesuada eu, pulvinar id, cursus eleifend, odio. Praesent quis enim. Etiam dictum magna ut diam. Quisque eros. Phasellus non neque nec sem venenatis imperdiet. Nunc ipsum dolor, dictum vel, suscipit et, mattis eu, magna. Maecenas at est. Donec nibh sem, aliquam tristique, molestie eget, varius eu, lorem. Ut commodo. Quisque cursus pretium nibh. Nam non mi. Ut cursus ipsum nec nisl.
        </p>
        <p>
        Donec porta rhoncus ante. Fusce commodo malesuada justo. Pellentesque sed lorem a arcu sagittis molestie. Nunc nunc. Aenean id risus ac nulla pulvinar feugiat. Quisque vestibulum nonummy tellus. In hac habitasse platea dictumst. Nam sollicitudin faucibus arcu. Aliquam laoreet mi eget libero. Nulla lorem tortor, aliquam consectetuer, posuere porta, commodo sed, massa. Maecenas accumsan, tortor id hendrerit egestas, eros risus elementum velit, quis placerat massa nunc in mauris. Morbi posuere pede nec lacus.
        </p>
        </div>
<?php
    } else if ($page == 2) {
?>
        <div id="divPage2">
        <p>Proin nisi ipsum, egestas sed, hendrerit ut, posuere vel, dolor. Nam auctor tellus molestie risus. Ut ut nibh. Sed urna pede, tristique id, semper et, venenatis sed, urna. Nam auctor cursus purus. Nunc quis sapien sit amet tortor aliquet venenatis. Maecenas iaculis sagittis nulla. Mauris ipsum. Suspendisse potenti. Maecenas fringilla sollicitudin urna. In nec felis vitae enim vulputate pulvinar. Vivamus non neque a magna tincidunt ultrices. Vestibulum facilisis orci quis elit ultrices accumsan.
        </p>
        <p>
        Phasellus tempus odio sit amet dui. Praesent posuere ante sed nisi. Maecenas in metus at tellus condimentum eleifend. Pellentesque varius diam et felis. Pellentesque aliquam viverra sapien. Aenean sed nulla. Donec felis magna, suscipit et, bibendum ut, ultricies in, velit. Etiam sit amet nunc. Cras imperdiet. Ut a erat in arcu molestie luctus. Mauris bibendum elementum neque. Duis a neque.
        </p>
        <p>
        Cras a justo at libero ornare imperdiet. Nam lacinia placerat libero. Sed eu metus eu mauris tempor consectetuer. Pellentesque gravida urna vitae turpis. Fusce elit mi, venenatis et, molestie sit amet, porttitor in, ipsum. Donec pulvinar pede eget turpis. Vivamus non felis. Maecenas scelerisque nibh in arcu. Donec sed ante. Suspendisse id turpis. Curabitur id arcu. Donec nec metus. Fusce semper lectus. Vestibulum sit amet enim.
        </p>
        
        <p>
        Phasellus cursus nibh vel metus. Nulla ullamcorper nulla. Aenean ut arcu sit amet massa tempus euismod. Fusce non lectus. Vestibulum eget massa. Nulla diam. Suspendisse iaculis, purus vel adipiscing convallis, lectus sem dictum dolor, ut interdum nunc est non elit. Maecenas tellus nulla, venenatis ut, venenatis vel, consequat ut, velit. Suspendisse accumsan faucibus ipsum. Proin ac nibh et sapien sollicitudin laoreet. Nunc diam dolor, dapibus ac, porta sed, placerat quis, urna. Aliquam non risus. Nunc adipiscing mollis ligula. Etiam vestibulum, erat sit amet pharetra molestie, libero leo semper mi, sed dignissim nisi velit eget elit. Nulla facilisi. Nunc laoreet viverra metus. Nunc semper lorem in velit. Pellentesque lacinia, velit eu sollicitudin bibendum, massa eros malesuada ante, sed pulvinar ipsum diam in justo. Curabitur euismod est ut lorem. Aenean vel felis at felis euismod hendrerit.
        </p>
        <p>
        Donec blandit nunc in sapien. Pellentesque euismod lorem. Aliquam erat volutpat. Suspendisse vitae enim non orci dignissim tempus. Morbi volutpat accumsan turpis. Donec malesuada, dolor vel egestas sollicitudin, lorem lacus facilisis elit, non sodales orci ante quis ante. Quisque libero leo, lobortis sit amet, adipiscing eu, malesuada sed, justo. Curabitur at magna a tortor interdum vestibulum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec sagittis pretium ipsum. Vivamus vulputate, dolor in egestas mollis, turpis sapien tempor arcu, vitae tempus ipsum nibh ut diam. Nunc eu massa. Proin quis ipsum. Ut ut diam. Curabitur elit enim, interdum id, rutrum eget, ullamcorper eget, enim. Vestibulum dapibus, diam et accumsan fringilla, est velit varius elit, ut luctus diam neque ut leo.
        </p>
        <p>
        Fusce iaculis. Donec sollicitudin nonummy augue. Duis adipiscing arcu non mi. In risus. Phasellus sodales, urna ut condimentum laoreet, magna felis dictum nisl, fringilla tristique lorem mauris vitae nunc. Maecenas ultrices laoreet ligula. Morbi erat ante, blandit id, venenatis ut, vulputate et, nisl. Sed id dui eget mi volutpat sodales. Pellentesque volutpat risus nec sapien. Quisque ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
        </p>
        </div>
<?php
    } else if ($page == 3) {
?>
        <div id="divPage3">
        <p>Nunc ante magna, faucibus non, faucibus in, rhoncus a, ante. In ut velit nec erat dapibus vulputate. Phasellus condimentum pulvinar metus. Cras leo neque, ultrices ut, tincidunt vitae, aliquet eu, erat. Mauris eget sem vitae est ornare aliquet. Etiam eros. In hac habitasse platea dictumst. Ut pellentesque metus. Integer eget mauris congue odio viverra hendrerit. Duis eu sapien. Aliquam erat volutpat. Vestibulum mattis. Aliquam tempus volutpat risus.
        </p>
        <p>
        Nulla lobortis leo quis elit. Nullam faucibus dolor at ante. Morbi fermentum. Integer euismod nisl vitae lacus. Phasellus pharetra enim. Etiam vel risus. Nulla facilisi. Nulla facilisi. Curabitur quis mi id dolor cursus ullamcorper. Praesent eu erat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer nec risus in nisl tempor vehicula. Pellentesque erat metus, viverra ut, eleifend vel, mattis ac, nibh. Ut ut dui in est pellentesque vulputate. Cras molestie.
        </p>
        <p>
        Praesent non elit. Maecenas at lacus. Pellentesque lectus. Nunc elementum aliquam mauris. Donec quis enim. In hac habitasse platea dictumst. Donec in dolor non sem congue ornare. Fusce id mauris in est condimentum interdum. Proin non purus eu mi feugiat vehicula. Quisque pulvinar bibendum dolor. Quisque urna enim, ullamcorper vel, porttitor eget, facilisis vitae, magna. Donec nec nisl nec sapien volutpat gravida. Donec nulla diam, sagittis ac, varius id, pellentesque at, quam. Nunc viverra pellentesque velit.
        
        </p>
        <p>
        Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Fusce quis ligula eu est tristique cursus. Nullam justo. In turpis. Cras nonummy eros non magna. Aenean convallis, elit at facilisis sagittis, metus ante luctus tortor, vitae aliquam elit nisl ut tellus. Curabitur arcu lacus, condimentum in, ornare ut, dictum quis, lacus. Nam porttitor ipsum sagittis diam. Suspendisse lobortis est. Aliquam erat volutpat. Integer eget justo in orci aliquam vehicula. Suspendisse nisi nisl, aliquet at, scelerisque vitae, semper non, justo. Maecenas sed est vitae dolor ullamcorper pellentesque. Sed non eros nec nisl ultrices gravida. Etiam et dui ac nisi tempus tincidunt.
        </p>
        <p>
        Curabitur iaculis molestie erat. Nunc ante. In est odio, venenatis a, lacinia nec, luctus at, justo. Proin enim. Nam consequat turpis non sem. Curabitur malesuada felis non erat. Nulla at velit sit amet metus scelerisque vehicula. Sed tincidunt, nunc nec ultricies varius, pede risus congue nisl, eu egestas justo mi a nulla. Phasellus nec dolor. Donec consectetuer metus ac sapien. Phasellus ipsum. Pellentesque euismod massa vitae ligula semper tristique. Vivamus et dui quis neque venenatis elementum. Curabitur pellentesque elementum diam. Quisque at mauris quis leo rhoncus consequat. In odio. In scelerisque ipsum nec lectus.
        </p>
        <p>
        Quisque eget ipsum. Duis mollis, libero nec nonummy feugiat, quam arcu cursus nisl, eget feugiat justo mauris sit amet risus. Maecenas posuere, libero nec porttitor sollicitudin, turpis turpis porta odio, at bibendum arcu lectus interdum ligula. Pellentesque facilisis, metus id convallis fermentum, dolor erat fringilla tortor, in iaculis quam lacus eu velit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis suscipit magna et arcu. Donec tempor. Quisque bibendum tellus eu sapien. Sed purus tellus, facilisis nec, consectetuer vel, cursus quis, tellus. Aliquam hendrerit iaculis purus. Proin a eros. Nullam lectus massa, ullamcorper vitae, varius vel, condimentum ut, sem. Nunc egestas aliquet leo. Sed pulvinar tellus id neque.
        </p>
        </div>
<?php        
    }
    
    if (!$dataOnly) {
?>                
    </body>
</html>
<?php        
    }
?>