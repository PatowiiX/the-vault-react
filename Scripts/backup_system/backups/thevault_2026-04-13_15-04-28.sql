/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: thevault
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-0+deb13u1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `carrito`
--

DROP TABLE IF EXISTS `carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `disco_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `disco_id` (`disco_id`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carrito_ibfk_2` FOREIGN KEY (`disco_id`) REFERENCES `discos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `carrito` WRITE;
/*!40000 ALTER TABLE `carrito` DISABLE KEYS */;
/*!40000 ALTER TABLE `carrito` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `carrito_items`
--

DROP TABLE IF EXISTS `carrito_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carrito_id` int(11) NOT NULL,
  `disco_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `carrito_id` (`carrito_id`),
  KEY `disco_id` (`disco_id`),
  CONSTRAINT `carrito_items_ibfk_1` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`),
  CONSTRAINT `carrito_items_ibfk_2` FOREIGN KEY (`disco_id`) REFERENCES `discos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `carrito_items` WRITE;
/*!40000 ALTER TABLE `carrito_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `carrito_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `carritos`
--

DROP TABLE IF EXISTS `carritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carritos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `carritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `contacto`
--

DROP TABLE IF EXISTS `contacto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacto`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `contacto` WRITE;
/*!40000 ALTER TABLE `contacto` DISABLE KEYS */;
INSERT INTO `contacto` VALUES
(1,'DIDI','usuario@correo.com','Hola','2026-02-25 23:33:48'),
(2,'Jairo','Tengohambre@correo.com','Soy un foraneo hambriento','2026-02-26 21:20:17'),
(3,'Jairo','usuario@correo.com','Holaaaa','2026-02-27 04:32:39');
/*!40000 ALTER TABLE `contacto` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `discos`
--

DROP TABLE IF EXISTS `discos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `discos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `artista` varchar(150) NOT NULL,
  `genero` varchar(100) DEFAULT 'Rock',
  `formato` enum('Vinyl','CD','Cassette') DEFAULT 'Vinyl',
  `imagen_path` varchar(500) DEFAULT NULL,
  `anio` int(11) DEFAULT 2024,
  `descripcion` text DEFAULT NULL,
  `top` tinyint(4) DEFAULT 0,
  `precio` decimal(10,2) DEFAULT 25.00,
  `stock` int(11) DEFAULT 0,
  `heritage` tinyint(4) DEFAULT 0,
  `tracks` int(11) DEFAULT 10,
  `duration` varchar(20) DEFAULT '45:00',
  `sku` varchar(50) DEFAULT 'VAULT-001',
  `edition` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `discos` WRITE;
/*!40000 ALTER TABLE `discos` DISABLE KEYS */;
INSERT INTO `discos` VALUES
(1,'The Dark Side of the Moon','Pink Floyd','Rock Progresivo','Cassette','https://m.media-amazon.com/images/I/51UtWpxbNYL._UF1000,1000_QL80_.jpg',1973,'Uno de los álbumes más icónicos de la historia del rock.',0,350.00,9,1,10,'45:00','VAULT-1',NULL,'2026-02-25 22:17:37'),
(2,'Abbey Road','The Beatles','Rock','CD','https://upload.wikimedia.org/wikipedia/commons/a/a4/The_Beatles_Abbey_Road_album_cover.jpg',1969,'Es el último álbum grabado por The Beatles, una despedida por todo lo grande.',0,250.00,8,0,17,'47:03','VAULT-002','Remasterizado 2019','2026-02-25 22:17:37'),
(3,'Be Here Now','Oasis','Rock','CD','https://m.media-amazon.com/images/I/91m+zuuM-XL.jpg',1997,'Tercer álbum de la banda británica \"Oasis\", una vuelta de tuerca a su estilo con mas en todo sentido.',0,200.00,19,0,13,'74:24','VAULT-003',NULL,'2026-02-25 22:17:37'),
(4,'Emergency On Planet Earth','Jamiroquai','Jazz','CD','https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg',1993,'Álbum debut de la banda de Acid Jazz y Funk \"Jamiroquai\".',0,280.00,10,0,5,'45:44','VAULT-004','Edición Mono Original','2026-02-25 22:17:37'),
(5,'Rumours','Fleetwood Mac','Rock','Cassette','https://m.media-amazon.com/images/I/71274uOsBUL._UF1000,1000_QL80_.jpg',1977,'Drama, pasión y grandes canciones, un álbum creado entre tensiones amorosas.',0,380.00,11,0,11,'39:43','VAULT-005',NULL,'2026-02-25 22:17:37'),
(6,'Mellon Collie And The Infinte Sadness','The Smashing Pumpkins','Alternative','CD','https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg',1995,'Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.',1,350.00,6,0,28,'45:00','VAULT-001',NULL,'2026-02-25 22:43:43'),
(7,'Tusk','Fleetwood Mac','Alternative','Vinyl','https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg',1979,'El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. ',0,299.00,0,0,10,'45:00','VAULT-7',NULL,'2026-02-26 21:16:23'),
(8,'The Bones Of What You Believe','CHVRCHES','Pop','Vinyl','https://m.media-amazon.com/images/I/81RBnHm8GVL._UF1000,1000_QL80_.jpg',2013,'Álbum debut de la banda escocesa CHVRCHES, y es considerado un pilar del synth-pop moderno.',0,200.00,10,0,10,'45:00','VAULT-001',NULL,'2026-02-27 08:46:05'),
(9,'Wish You Were Here','Pink Floyd','Alternative','Vinyl','https://images.genius.com/57e05ca38ee171cf70fd9486aa6dd40a.1000x1000x1.png',1975,'Álbum conceptual de la banda que explora la ausencia, la desilusión con la industria musical y el profundo sentimiento de pérdida tras la partida de su fundador, Syd Barrett.',1,300.00,12,1,10,'45:00','VAULT-001',NULL,'2026-02-28 02:59:12'),
(10,'The Works','Queen','Rock','CD','https://m.media-amazon.com/images/I/61Mr+SoLzKL._UF1000,1000_QL80_.jpg',1983,'Undécimo álbum de estudio de Queen, marcó el esperado regreso de la banda a sus raíces de rock, pero con un toque moderno y electrónico.',0,350.00,10,0,10,'45:00','VAULT-001',NULL,'2026-03-02 22:51:54'),
(11,'Pisces Iscariot','The Smashing Pumpkins','Alternative','Vinyl','https://m.media-amazon.com/images/I/31r-6qWc-CL._UF1000,1000_QL80_.jpg',1994,'Colección de caras B y rarezas de The Smashing Pumpkins. \nReúne descartes de Gish y Siamese Dream, destacando temas como \"Landslide\" y \"Starla\".\n',1,255.00,15,0,10,'45:00','VAULT-001',NULL,'2026-03-02 22:56:06'),
(12,'Ritchie Blackmore\'s Rainbow','Rainbow','Rock','Cassette','https://m.media-amazon.com/images/I/41evODrqSIL._UF1000,1000_QL80_.jpg',1975,'Lanzado en 1975, es el debut de la banda liderada por Ritchie Blackmore tras dejar Deep Purple. Fusiona hard rock con tintes medievales y cuenta con la voz magistral de Ronnie James Dio.',1,450.00,19,0,10,'45:00','VAULT-001',NULL,'2026-03-02 23:00:27'),
(13,'Sgt Pepper\'s Lonely Hearts Club Band','The Beatles','Rock','Cassette','https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sgt._Pepper%27s_Lonely_Hearts_Club_Band_album_art.jpg/1280px-Sgt._Pepper%27s_Lonely_Hearts_Club_Band_album_art.jpg',1976,'Lanzado en 1967, es la obra de The Beatles que revolucionó la música moderna al popularizar el concepto de álbum conceptual. ',0,299.00,9,0,10,'45:00','VAULT-001',NULL,'2026-03-02 23:19:48'),
(14,'Diver Down','Van Halen','Rock','Cassette','https://upload.wikimedia.org/wikipedia/commons/d/d4/Van_Halen_-_Diver_Down.svg',1982,'Álbum de Van Halen (1982) dominado por covers y éxitos radiales. Es el disco más corto y espontáneo de la era de David Lee Roth.',0,300.00,15,0,10,'45:00','VAULT-001',NULL,'2026-03-02 23:23:20'),
(15,'Good','Michael Jackson','Pop','Vinyl','https://preview.redd.it/8wn980x0zif71.png?auto=webp&s=46660ae9c62843ae19254bce9b638f190f7d9e45',1985,'Es bueno, es bueno, lo sabes.',1,29.00,10,0,10,'45:00','VAULT-001',NULL,'2026-03-03 22:07:25'),
(16,'Carnavas','Silversun Pickups','Rock','CD','https://m.media-amazon.com/images/I/81-snUL6kGL._UF1000,1000_QL80_.jpg',2006,'Referente del shoegaze/indie rock contemporáneo. Destaca por su arquitectura sonora de capas densas de distorsión, estructuras dinámicas de \"suave-fuerte\" y una producción atmosférica que evoca el rock alternativo de los 90.\n',0,350.00,11,0,11,'55 minutos','V-1597',NULL,'2026-04-09 19:45:43'),
(17,'Under The Iron Sea','Keane','Alternative','Vinyl','https://m.media-amazon.com/images/I/61Vy9dqBpLL._UF1000,1000_QL80_.jpghttps://m.media-amazon.com/images/I/61Vy9dqBpLL._UF1000,1000_QL80_.jpg',2006,'Segundo álbum de estudio de la banda británica. Se caracteriza por una atmósfera oscura, introspectiva y experimental, alejándose del optimismo de su debut. Es una obra conceptual que utiliza la metáfora de un \"mar de hierro\" para explorar temas de alienación, guerra y conflictos internos.',0,400.00,15,0,12,'50:30','V-K34n3',NULL,'2026-04-09 19:48:43'),
(18,'Even Worse',' \"Weird Al\" Yankovic','Pop','CD','https://upload.wikimedia.org/wikipedia/en/4/4c/Weird_Al_Yankovic_-_Even_Worse.jpg',1988,'Even Worse is the fifth studio album by the American parody musician \"Weird Al\" Yankovic, released on April 12, 1988. The album was produced by former The McCoys guitarist Rick Derringer. Recorded between November 1987 and February 1988, this album helped to revitalize Yankovic\'s career after the critical and commercial failure of his previous album Polka Party! (1986).',1,69.69,67,0,3,'21.32','1684531',NULL,'2026-04-12 02:03:06');
/*!40000 ALTER TABLE `discos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `ordenes`
--

DROP TABLE IF EXISTS `ordenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(50) DEFAULT 'pendiente',
  `orden_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`orden_items`)),
  `shipping_cost` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `tracking_number` varchar(100) DEFAULT NULL,
  `estimated_delivery` datetime DEFAULT NULL,
  `paypal_order_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `ordenes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ordenes` WRITE;
/*!40000 ALTER TABLE `ordenes` DISABLE KEYS */;
INSERT INTO `ordenes` VALUES
(1,1,435.28,'pagado','[{\"id\": 4, \"sku\": \"VAULT-004\", \"year\": 1993, \"genre\": \"Jazz\", \"image\": \"https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg\", \"price\": 28.99, \"stock\": 10, \"title\": \"Emergency On Planet Earth\", \"artist\": \"Jamiroquai\", \"format\": \"CD\", \"tracks\": 5, \"edition\": \"Edición Mono Original\", \"duration\": \"45:44\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda de Acid Jazz y Funk \\\"Jamiroquai\\\".\"}]',99.00,46.38,289.90,'TRK-1772396525546-Y93SYT','2026-03-06 14:22:06',NULL,'2026-03-01 20:22:05'),
(3,1,435.28,'pagado','[{\"id\": 4, \"sku\": \"VAULT-004\", \"year\": 1993, \"genre\": \"Jazz\", \"image\": \"https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg\", \"price\": 28.99, \"stock\": 10, \"title\": \"Emergency On Planet Earth\", \"artist\": \"Jamiroquai\", \"format\": \"CD\", \"tracks\": 5, \"edition\": \"Edición Mono Original\", \"duration\": \"45:44\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda de Acid Jazz y Funk \\\"Jamiroquai\\\".\"}]',99.00,46.38,289.90,'TRK-1772404664340-2VIY89','2026-03-06 16:37:44','852946160R0337215','2026-03-01 22:37:44'),
(4,1,446.88,'pagado','[{\"id\": 7, \"sku\": \"VAULT-001\", \"year\": 1979, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Tusk\", \"artist\": \"Fleetwood Mac\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": false, \"heritage\": false, \"quantity\": 10, \"description\": \"El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. \"}]',99.00,47.98,299.90,'TRK-1772404728550-DLP18U','2026-03-06 16:38:49','79670439NC2671414','2026-03-01 22:38:48'),
(5,1,446.88,'pagado','[{\"id\": 8, \"sku\": \"VAULT-001\", \"year\": 2013, \"genre\": \"Pop\", \"image\": \"https://m.media-amazon.com/images/I/81RBnHm8GVL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"The Bones Of What You Believe\", \"artist\": \"CHVRCHES\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda escocesa CHVRCHES, y es considerado un pilar del synth-pop moderno.\"}]',99.00,47.98,299.90,'TRK-1772405576631-W8CW62','2026-03-06 16:52:57','43V523641A877972H','2026-03-01 22:52:56'),
(6,1,133.79,'pagado','[{\"id\": 6, \"sku\": \"VAULT-001\", \"year\": 1995, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Mellon Collie And The Infinte Sadness\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"CD\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.\"}]',99.00,4.80,29.99,'TRK-1772405754347-OLS72E','2026-03-06 16:55:54','1N310273X89823432','2026-03-01 22:55:54'),
(7,1,130.31,'pagado','[{\"id\": 5, \"sku\": \"VAULT-005\", \"year\": 1977, \"genre\": \"Rock\", \"image\": \"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMECit7q92fnEv9rANy_qVsyoKRcWT_1Smbg&s\", \"price\": 26.99, \"stock\": 12, \"title\": \"Rumours\", \"artist\": \"Fleetwood Mac\", \"format\": \"Cassette\", \"tracks\": 11, \"edition\": null, \"duration\": \"39:43\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Drama, pasión y grandes canciones.\"}]',99.00,4.32,26.99,'TRK-1772405869188-B9M7X9','2026-03-06 16:57:49','04821845NT859431P','2026-03-01 22:57:49'),
(8,1,133.79,'pagado','[{\"id\": 9, \"sku\": \"VAULT-001\", \"year\": 1975, \"genre\": \"Alternative\", \"image\": \"https://images.genius.com/57e05ca38ee171cf70fd9486aa6dd40a.1000x1000x1.png\", \"price\": 29.99, \"stock\": 15, \"title\": \"Wish You Were Here\", \"artist\": \"Pink Floyd\", \"format\": \"Cassette\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Álbum conceptual de la banda que explora la ausencia, la desilusión con la industria musical y el profundo sentimiento de pérdida tras la partida de su fundador, Syd Barrett.\"}]',99.00,4.80,29.99,'TRK-1772415513197-Z9UOBY','2026-03-06 19:38:33','4WH2189001989482N','2026-03-02 01:38:33'),
(9,1,446.88,'pagado','[{\"id\": 7, \"sku\": \"VAULT-001\", \"year\": 1979, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Tusk\", \"artist\": \"Fleetwood Mac\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": false, \"heritage\": false, \"quantity\": 10, \"description\": \"El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. \"}]',99.00,47.98,299.90,'TRK-1772417310858-H1YJOG','2026-03-06 20:08:31','82031584EC9609902','2026-03-02 02:08:30'),
(10,1,446.88,'pagado','[{\"id\": 7, \"sku\": \"VAULT-001\", \"year\": 1979, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Tusk\", \"artist\": \"Fleetwood Mac\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": false, \"heritage\": false, \"quantity\": 10, \"description\": \"El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. \"}]',99.00,47.98,299.90,'TRK-1772419293584-DZU7D4','2026-03-06 20:41:34','4ET98901ED907264N','2026-03-02 02:41:33'),
(11,1,162.79,'pagado','[{\"id\": 9, \"sku\": \"VAULT-001\", \"year\": 1975, \"genre\": \"Alternative\", \"image\": \"https://images.genius.com/57e05ca38ee171cf70fd9486aa6dd40a.1000x1000x1.png\", \"price\": 29.99, \"stock\": 14, \"title\": \"Wish You Were Here\", \"artist\": \"Pink Floyd\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": true, \"quantity\": 1, \"description\": \"Álbum conceptual de la banda que explora la ausencia, la desilusión con la industria musical y el profundo sentimiento de pérdida tras la partida de su fundador, Syd Barrett.\"}, {\"id\": 11, \"sku\": \"VAULT-001\", \"year\": 1994, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/31r-6qWc-CL._UF1000,1000_QL80_.jpg\", \"price\": 25, \"stock\": 18, \"title\": \"Pisces Iscariot\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Colección de caras B y rarezas de The Smashing Pumpkins. \\nReúne descartes de Gish y Siamese Dream, destacando temas como \\\"Landslide\\\" y \\\"Starla\\\".\\n\"}]',99.00,8.80,54.99,'TRK-1772492736189-LFT4SQ','2026-03-07 17:05:36','0DP80260X8501683X','2026-03-02 23:05:36'),
(12,7,128.00,'pagado','[{\"id\": 11, \"sku\": \"VAULT-001\", \"year\": 1994, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/31r-6qWc-CL._UF1000,1000_QL80_.jpg\", \"price\": 25, \"stock\": 17, \"title\": \"Pisces Iscariot\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Colección de caras B y rarezas de The Smashing Pumpkins. \\nReúne descartes de Gish y Siamese Dream, destacando temas como \\\"Landslide\\\" y \\\"Starla\\\".\\n\"}]',99.00,4.00,25.00,'TRK-1772493132836-X4PB6F','2026-03-07 17:12:13','30E70244119323311','2026-03-02 23:12:12'),
(13,1,1032.80,'pagado','[{\"id\": 11, \"sku\": \"VAULT-001\", \"year\": 1994, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/31r-6qWc-CL._UF1000,1000_QL80_.jpg\", \"price\": 255, \"stock\": 16, \"title\": \"Pisces Iscariot\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Colección de caras B y rarezas de The Smashing Pumpkins. \\nReúne descartes de Gish y Siamese Dream, destacando temas como \\\"Landslide\\\" y \\\"Starla\\\".\\n\"}, {\"id\": 6, \"sku\": \"VAULT-001\", \"year\": 1995, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg\", \"price\": 350, \"stock\": 9, \"title\": \"Mellon Collie And The Infinte Sadness\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"CD\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.\"}, {\"id\": 3, \"sku\": \"VAULT-003\", \"year\": 1997, \"genre\": \"Rock\", \"image\": \"https://m.media-amazon.com/images/I/91m+zuuM-XL.jpg\", \"price\": 200, \"stock\": 20, \"title\": \"Be Here Now\", \"artist\": \"Oasis\", \"format\": \"CD\", \"tracks\": 13, \"edition\": null, \"duration\": \"74:24\", \"featured\": false, \"heritage\": false, \"quantity\": 1, \"description\": \"Tercer álbum de la banda británica \\\"Oasis\\\", una vuelta de tuerca a su estilo con mas en todo sentido.\"}]',99.00,128.80,805.00,'TRK-1772493435104-EM4BGK','2026-03-07 17:17:15','6MP74992S44308055','2026-03-02 23:17:15'),
(14,7,793.84,'pagado','[{\"id\": 13, \"sku\": \"VAULT-001\", \"year\": 1976, \"genre\": \"Rock\", \"image\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sgt._Pepper%27s_Lonely_Hearts_Club_Band_album_art.jpg/1280px-Sgt._Pepper%27s_Lonely_Hearts_Club_Band_album_art.jpg\", \"price\": 299, \"stock\": 10, \"title\": \"Sgt Pepper\'s Lonely Hearts Club Band\", \"artist\": \"The Beatles\", \"format\": \"Cassette\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Lanzado en 1967, es la obra de The Beatles que revolucionó la música moderna al popularizar el concepto de álbum conceptual. \"}, {\"id\": 9, \"sku\": \"VAULT-001\", \"year\": 1975, \"genre\": \"Alternative\", \"image\": \"https://images.genius.com/57e05ca38ee171cf70fd9486aa6dd40a.1000x1000x1.png\", \"price\": 300, \"stock\": 13, \"title\": \"Wish You Were Here\", \"artist\": \"Pink Floyd\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": true, \"quantity\": 1, \"description\": \"Álbum conceptual de la banda que explora la ausencia, la desilusión con la industria musical y el profundo sentimiento de pérdida tras la partida de su fundador, Syd Barrett.\"}]',99.00,95.84,599.00,'TRK-1772575356037-DWMC29','2026-03-08 16:02:36','03084590EC4993425','2026-03-03 22:02:36'),
(15,7,911.00,'pagado','[{\"id\": 6, \"sku\": \"VAULT-001\", \"year\": 1995, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg\", \"price\": 350, \"stock\": 8, \"title\": \"Mellon Collie And The Infinte Sadness\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"CD\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 2, \"description\": \"Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.\"}]',99.00,112.00,700.00,'TRK-1772576698560-W0R66I','2026-03-08 16:24:59','7DD67247JD307462M','2026-03-03 22:24:58');
/*!40000 ALTER TABLE `ordenes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `ordenes_backup`
--

DROP TABLE IF EXISTS `ordenes_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `usuario_id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(50) DEFAULT 'pendiente',
  `orden_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`orden_items`)),
  `shipping_cost` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `tracking_number` varchar(100) DEFAULT NULL,
  `estimated_delivery` datetime DEFAULT NULL,
  `paypal_order_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_backup`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ordenes_backup` WRITE;
/*!40000 ALTER TABLE `ordenes_backup` DISABLE KEYS */;
INSERT INTO `ordenes_backup` VALUES
(1,1,435.28,'pagado','[{\"id\": 4, \"sku\": \"VAULT-004\", \"year\": 1993, \"genre\": \"Jazz\", \"image\": \"https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg\", \"price\": 28.99, \"stock\": 10, \"title\": \"Emergency On Planet Earth\", \"artist\": \"Jamiroquai\", \"format\": \"CD\", \"tracks\": 5, \"edition\": \"Edición Mono Original\", \"duration\": \"45:44\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda de Acid Jazz y Funk \\\"Jamiroquai\\\".\"}]',99.00,46.38,289.90,'TRK-1772396525546-Y93SYT','2026-03-06 14:22:06',NULL,'2026-03-01 20:22:05'),
(3,1,435.28,'pagado','[{\"id\": 4, \"sku\": \"VAULT-004\", \"year\": 1993, \"genre\": \"Jazz\", \"image\": \"https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg\", \"price\": 28.99, \"stock\": 10, \"title\": \"Emergency On Planet Earth\", \"artist\": \"Jamiroquai\", \"format\": \"CD\", \"tracks\": 5, \"edition\": \"Edición Mono Original\", \"duration\": \"45:44\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda de Acid Jazz y Funk \\\"Jamiroquai\\\".\"}]',99.00,46.38,289.90,'TRK-1772404664340-2VIY89','2026-03-06 16:37:44','852946160R0337215','2026-03-01 22:37:44'),
(4,1,446.88,'pagado','[{\"id\": 7, \"sku\": \"VAULT-001\", \"year\": 1979, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Tusk\", \"artist\": \"Fleetwood Mac\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": false, \"heritage\": false, \"quantity\": 10, \"description\": \"El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. \"}]',99.00,47.98,299.90,'TRK-1772404728550-DLP18U','2026-03-06 16:38:49','79670439NC2671414','2026-03-01 22:38:48'),
(5,1,446.88,'pagado','[{\"id\": 8, \"sku\": \"VAULT-001\", \"year\": 2013, \"genre\": \"Pop\", \"image\": \"https://m.media-amazon.com/images/I/81RBnHm8GVL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"The Bones Of What You Believe\", \"artist\": \"CHVRCHES\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 10, \"description\": \"Álbum debut de la banda escocesa CHVRCHES, y es considerado un pilar del synth-pop moderno.\"}]',99.00,47.98,299.90,'TRK-1772405576631-W8CW62','2026-03-06 16:52:57','43V523641A877972H','2026-03-01 22:52:56'),
(6,1,133.79,'pagado','[{\"id\": 6, \"sku\": \"VAULT-001\", \"year\": 1995, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Mellon Collie And The Infinte Sadness\", \"artist\": \"The Smashing Pumpkins\", \"format\": \"CD\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.\"}]',99.00,4.80,29.99,'TRK-1772405754347-OLS72E','2026-03-06 16:55:54','1N310273X89823432','2026-03-01 22:55:54'),
(7,1,130.31,'pagado','[{\"id\": 5, \"sku\": \"VAULT-005\", \"year\": 1977, \"genre\": \"Rock\", \"image\": \"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMECit7q92fnEv9rANy_qVsyoKRcWT_1Smbg&s\", \"price\": 26.99, \"stock\": 12, \"title\": \"Rumours\", \"artist\": \"Fleetwood Mac\", \"format\": \"Cassette\", \"tracks\": 11, \"edition\": null, \"duration\": \"39:43\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Drama, pasión y grandes canciones.\"}]',99.00,4.32,26.99,'TRK-1772405869188-B9M7X9','2026-03-06 16:57:49','04821845NT859431P','2026-03-01 22:57:49'),
(8,1,133.79,'pagado','[{\"id\": 9, \"sku\": \"VAULT-001\", \"year\": 1975, \"genre\": \"Alternative\", \"image\": \"https://images.genius.com/57e05ca38ee171cf70fd9486aa6dd40a.1000x1000x1.png\", \"price\": 29.99, \"stock\": 15, \"title\": \"Wish You Were Here\", \"artist\": \"Pink Floyd\", \"format\": \"Cassette\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": true, \"heritage\": false, \"quantity\": 1, \"description\": \"Álbum conceptual de la banda que explora la ausencia, la desilusión con la industria musical y el profundo sentimiento de pérdida tras la partida de su fundador, Syd Barrett.\"}]',99.00,4.80,29.99,'TRK-1772415513197-Z9UOBY','2026-03-06 19:38:33','4WH2189001989482N','2026-03-02 01:38:33'),
(9,1,446.88,'pagado','[{\"id\": 7, \"sku\": \"VAULT-001\", \"year\": 1979, \"genre\": \"Alternative\", \"image\": \"https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg\", \"price\": 29.99, \"stock\": 10, \"title\": \"Tusk\", \"artist\": \"Fleetwood Mac\", \"format\": \"Vinyl\", \"tracks\": 10, \"edition\": null, \"duration\": \"45:00\", \"featured\": false, \"heritage\": false, \"quantity\": 10, \"description\": \"El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. \"}]',99.00,47.98,299.90,'TRK-1772417310858-H1YJOG','2026-03-06 20:08:31','82031584EC9609902','2026-03-02 02:08:30');
/*!40000 ALTER TABLE `ordenes_backup` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES
(1,3,'e21cf0328d998d1b02dbd5e59554e52f0e0830bfe8e3eaec03ee9b9cb0295205','2026-02-26 23:52:30',0,'2026-02-27 04:52:29'),
(2,5,'2bf37fcdcbaf906ef470a5dd1cbb60808cbcaf88bdc3be5e5f0b4e2d9217ead3','2026-02-26 23:55:19',0,'2026-02-27 04:55:18'),
(3,5,'d1a8caa968ce010bd9be33bdaca8631a5e871807a0e3c11f3c023c690dab1b8f','2026-02-26 23:55:32',0,'2026-02-27 04:55:31'),
(4,5,'6643b53e005e6c65778b31cfe614aec75813f4d992b1cdd12b2660bcfd73fd7c','2026-02-26 23:55:58',0,'2026-02-27 04:55:58'),
(5,5,'1bc9d0955e0543bfdb3eebe7bc221f136458cbc564f43e4dd99de57424698c4f','2026-02-26 23:57:38',0,'2026-02-27 04:57:38'),
(6,5,'36a30f57381f410e6c6d7e3600c517091a69cebb524efa0ab9c1ff8ec60c23d6','2026-02-26 23:57:40',0,'2026-02-27 04:57:39'),
(7,6,'71ca98cf269d684b777c9711874748766924fab8741b95e22c177c76cd0fa5f3','2026-02-27 00:08:23',0,'2026-02-27 05:08:23'),
(8,6,'1bd8ecbffb3de5f490303c573946fc80e7d7f54756a6123eb574b5ef66aa612f','2026-02-27 00:09:00',0,'2026-02-27 05:08:59'),
(9,6,'63d0d5be622964c66fee98f6f0436aa6cafa4f363c4652df9d44129fe9932edf','2026-02-27 00:09:01',0,'2026-02-27 05:09:00'),
(10,6,'185f7b42a14f286d75fe8764d6c056a17756cd5f239c3c7fafd2e35e39dd9939','2026-02-27 00:09:11',0,'2026-02-27 05:09:11'),
(11,6,'11a2210771fd6a1f1014939010f8db08abd41d661904b525e502dd61b4a39239','2026-02-27 00:13:24',0,'2026-02-27 05:13:24'),
(12,6,'8aa8bc917c57fc7192fcc979ca60db147d08ce32902fe0e1d2cb31a200626e63','2026-02-27 00:13:42',0,'2026-02-27 05:13:41'),
(13,6,'9266300cf64d6b7673cc77d841a03e5e84f368d7d5700b8d27a6464776faf54c','2026-02-27 00:16:17',0,'2026-02-27 05:16:17'),
(14,6,'e346ba99c9ef645c303914360bd4ddc2801ee3565881c446ce6549153ed9057c','2026-02-27 00:16:32',0,'2026-02-27 05:16:32'),
(15,6,'8f7b4ecf3d65dcfc9bfdc4ebbab6e51982e9b088e771a760f711af4a310a1340','2026-02-27 00:19:59',0,'2026-02-27 05:19:58'),
(16,6,'4507b5453bc14bbe761ebe5274ad0d45fe5301e29dd30d8d988eb48fc44322d3','2026-02-27 00:21:13',0,'2026-02-27 05:21:13'),
(17,6,'918beded6e07cdf314e22b12af0bbee25000afb047a08a1b9c5fde6c3cf53257','2026-02-27 00:27:44',0,'2026-02-27 05:27:44'),
(18,6,'e64b0102afb1e35805eee5ae794810b93cf7f8f81061f55e8c26b5d3cb4af5e1','2026-02-27 00:31:04',0,'2026-02-27 05:31:04'),
(19,6,'2ac588cfe295b215d9d0f9d77dea2369b5b07f4c6c0a3a5e85ee7b761a2abc2a','2026-02-27 00:32:36',0,'2026-02-27 05:32:35'),
(20,6,'e901bb6c6653671cac7897e10c983dc4030daa1cac38c0ea051b8b68ec63f83c','2026-02-27 00:35:38',0,'2026-02-27 05:35:38'),
(21,6,'f3ab74d9b1f0285dc79685e449749bdaaea955571c798c7faaf21f74af2a73a1','2026-02-27 00:43:28',0,'2026-02-27 05:43:27'),
(22,6,'da1f6402dd98d0b86c6d6182927bc1d2f0dd7c31f9e42582081bb0b783516cdc','2026-02-27 03:33:35',1,'2026-02-27 08:33:34'),
(23,6,'474222b646538d23d7f4800928445928728735cc0e0a2c783f4de067087deacd','2026-02-27 03:38:24',1,'2026-02-27 08:38:23'),
(24,6,'7c96173c94fca963b51f853fd38387dc9b20a9b0eab591a47a95516110bf4cde','2026-02-27 17:06:30',1,'2026-02-27 22:06:29'),
(25,6,'2389e17015fc288ed01e5e27f78b4eb980ea7954a277f3a7c0ede59d7de13c3c','2026-03-01 21:51:36',1,'2026-03-02 02:51:36');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `last4` varchar(4) NOT NULL,
  `card_holder` varchar(100) NOT NULL,
  `expiry_date` varchar(7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `stock_history`
--

DROP TABLE IF EXISTS `stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `disco_id` int(11) NOT NULL,
  `cambio` int(11) NOT NULL,
  `stock_anterior` int(11) NOT NULL,
  `stock_nuevo` int(11) NOT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `disco_id` (`disco_id`),
  CONSTRAINT `stock_history_ibfk_1` FOREIGN KEY (`disco_id`) REFERENCES `discos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_history`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `stock_history` WRITE;
/*!40000 ALTER TABLE `stock_history` DISABLE KEYS */;
INSERT INTO `stock_history` VALUES
(1,4,-10,10,0,'paypal_compra','2026-03-01 20:22:05'),
(3,4,-10,10,0,'paypal_compra','2026-03-01 22:37:44'),
(4,7,-10,10,0,'paypal_compra','2026-03-01 22:38:48'),
(5,8,-10,10,0,'paypal_compra','2026-03-01 22:52:56'),
(6,6,-1,10,9,'paypal_compra','2026-03-01 22:55:54'),
(7,5,-1,12,11,'paypal_compra','2026-03-01 22:57:49'),
(8,9,-1,15,14,'paypal_compra','2026-03-02 01:38:33'),
(9,7,-10,10,0,'paypal_compra','2026-03-02 02:08:30'),
(10,7,-10,10,0,'paypal_compra','2026-03-02 02:41:33'),
(11,9,-1,14,13,'paypal_compra','2026-03-02 23:05:36'),
(12,11,-1,18,17,'paypal_compra','2026-03-02 23:05:36'),
(13,11,-1,17,16,'paypal_compra','2026-03-02 23:12:12'),
(14,11,-1,16,15,'paypal_compra','2026-03-02 23:17:15'),
(15,6,-1,9,8,'paypal_compra','2026-03-02 23:17:15'),
(16,3,-1,20,19,'paypal_compra','2026-03-02 23:17:15'),
(17,13,-1,10,9,'paypal_compra','2026-03-03 22:02:36'),
(18,9,-1,13,12,'paypal_compra','2026-03-03 22:02:36'),
(19,6,-2,8,6,'paypal_compra','2026-03-03 22:24:58');
/*!40000 ALTER TABLE `stock_history` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','user') DEFAULT 'user',
  `avatar` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'AdminChad','admin@retrosound.com','$2b$10$bVnIsiek.ROsNnX1llJc/OzB3rKj8Z5wuw9fHuhzzFw5gpNnfkOuW','admin','/uploads/avatars/avatar-1-1775722887913-473049763.jpg','2026-02-25 22:17:37'),
(2,'coleccionista','user@retrosound.com','user123','user',NULL,'2026-02-25 22:17:37'),
(3,'Usuario1','Usuario1@correo.com','123456789','user',NULL,'2026-02-25 23:02:52'),
(4,'usuario2','usuario2@correo.mx','789456123','user',NULL,'2026-02-26 23:04:32'),
(5,'PatowiiX','patogamecubeawesome@gmail.com','Mazdaspeed3','user',NULL,'2026-02-27 04:54:59'),
(6,'PatowiiX2','psgamerfanclub@gmail.com','Contraseñasupersegura','user',NULL,'2026-02-27 05:07:53'),
(7,'P.Rivera1','jpabloriveraarenas@gmail.com','AlbumBlanco123','user',NULL,'2026-03-02 23:11:11');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-04-13 15:04:28
