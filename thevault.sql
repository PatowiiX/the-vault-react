-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: thevault
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carrito`
--

DROP TABLE IF EXISTS `carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `disco_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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

LOCK TABLES `carrito` WRITE;
/*!40000 ALTER TABLE `carrito` DISABLE KEYS */;
/*!40000 ALTER TABLE `carrito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacto`
--

DROP TABLE IF EXISTS `contacto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacto`
--

LOCK TABLES `contacto` WRITE;
/*!40000 ALTER TABLE `contacto` DISABLE KEYS */;
INSERT INTO `contacto` VALUES (1,'DIDI','usuario@correo.com','Hola','2026-02-25 23:33:48'),(2,'Jairo','Tengohambre@correo.com','Soy un foraneo hambriento','2026-02-26 21:20:17'),(3,'Jairo','usuario@correo.com','Holaaaa','2026-02-27 04:32:39');
/*!40000 ALTER TABLE `contacto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discos`
--

DROP TABLE IF EXISTS `discos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `artista` varchar(150) NOT NULL,
  `genero` varchar(100) DEFAULT 'Rock',
  `formato` enum('Vinyl','CD','Cassette') DEFAULT 'Vinyl',
  `imagen_path` varchar(500) DEFAULT NULL,
  `anio` int DEFAULT '2024',
  `descripcion` text,
  `top` tinyint DEFAULT '0',
  `precio` decimal(10,2) DEFAULT '25.00',
  `stock` int DEFAULT '10',
  `heritage` tinyint DEFAULT '0',
  `tracks` int DEFAULT '10',
  `duration` varchar(20) DEFAULT '45:00',
  `sku` varchar(50) DEFAULT 'VAULT-001',
  `edition` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discos`
--

LOCK TABLES `discos` WRITE;
/*!40000 ALTER TABLE `discos` DISABLE KEYS */;
INSERT INTO `discos` VALUES (1,'The Dark Side of the Moon','Pink Floyd','Rock Progresivo','Vinyl','https://m.media-amazon.com/images/I/51UtWpxbNYL._UF1000,1000_QL80_.jpg',1973,'Uno de los álbumes más icónicos de la historia del rock.',1,35.99,9,1,10,'42:49','VAULT-001','Edición Limitada 50 Aniversario','2026-02-25 22:17:37'),(2,'Abbey Road','The Beatles','Rock','CD','https://upload.wikimedia.org/wikipedia/commons/a/a4/The_Beatles_Abbey_Road_album_cover.jpg',1969,'Es el último álbum grabado por The Beatles, una despedida por todo lo grande.',1,29.99,8,0,17,'47:03','VAULT-002','Remasterizado 2019','2026-02-25 22:17:37'),(3,'Be Here Now','Oasis','Rock','CD','https://m.media-amazon.com/images/I/91m+zuuM-XL.jpg',1997,'Tercer álbum de la banda británica \"Oasis\", una vuelta de tuerca a su estilo con mas en todo sentido.',1,32.50,20,0,13,'74:24','VAULT-003',NULL,'2026-02-25 22:17:37'),(4,'Emergency On Planet Earth','Jamiroquai','Jazz','CD','https://m.media-amazon.com/images/I/61SYYAPbTAL.jpg',1993,'Álbum debut de la banda de Acid Jazz y Funk \"Jamiroquai\".',1,28.99,10,0,5,'45:44','VAULT-004','Edición Mono Original','2026-02-25 22:17:37'),(5,'Rumours','Fleetwood Mac','Rock','Cassette','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMECit7q92fnEv9rANy_qVsyoKRcWT_1Smbg&s',1977,'Drama, pasión y grandes canciones.',0,26.99,12,0,11,'39:43','VAULT-005',NULL,'2026-02-25 22:17:37'),(6,'Mellon Collie And The Infinte Sadness','The Smashing Pumpkins','Rock','CD','https://m.media-amazon.com/images/I/71DuF5drPIL._UF1000,1000_QL80_.jpg',1995,'Álbum doble de 1995 que consagró a The Smashing Pumpkins como iconos del rock alternativo mediante 28 canciones sobre la angustia y la nostalgia.',0,29.99,10,0,10,'45:00','VAULT-001',NULL,'2026-02-25 22:43:43'),(7,'Tusk','Fleetwood Mac','Alternative','Vinyl','https://m.media-amazon.com/images/I/717tH0Af1OL._UF1000,1000_QL80_.jpg',1979,'El Álbum más experimental y ambicioso de Fleetwood Mac. Marcado por un sonido crudo, ecléctico y vanguardista. ',0,29.99,10,0,10,'45:00','VAULT-001',NULL,'2026-02-26 21:16:23'),(8,'The Bones Of What You Believe','CHVRCHES','Pop','Vinyl','https://m.media-amazon.com/images/I/81RBnHm8GVL._UF1000,1000_QL80_.jpg',2013,'Álbum debut de la banda escocesa CHVRCHES, y es considerado un pilar del synth-pop moderno.',0,29.99,10,0,10,'45:00','VAULT-001',NULL,'2026-02-27 08:46:05');
/*!40000 ALTER TABLE `discos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes`
--

DROP TABLE IF EXISTS `ordenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','pagado','enviado','entregado') DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `orden_items` json DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `payer_email` varchar(255) DEFAULT NULL,
  `transaction_data` text,
  `shipping_cost` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tracking_number` varchar(100) DEFAULT NULL,
  `estimated_delivery` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `ordenes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes`
--

LOCK TABLES `ordenes` WRITE;
/*!40000 ALTER TABLE `ordenes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,3,'e21cf0328d998d1b02dbd5e59554e52f0e0830bfe8e3eaec03ee9b9cb0295205','2026-02-26 23:52:30',0,'2026-02-27 04:52:29'),(2,5,'2bf37fcdcbaf906ef470a5dd1cbb60808cbcaf88bdc3be5e5f0b4e2d9217ead3','2026-02-26 23:55:19',0,'2026-02-27 04:55:18'),(3,5,'d1a8caa968ce010bd9be33bdaca8631a5e871807a0e3c11f3c023c690dab1b8f','2026-02-26 23:55:32',0,'2026-02-27 04:55:31'),(4,5,'6643b53e005e6c65778b31cfe614aec75813f4d992b1cdd12b2660bcfd73fd7c','2026-02-26 23:55:58',0,'2026-02-27 04:55:58'),(5,5,'1bc9d0955e0543bfdb3eebe7bc221f136458cbc564f43e4dd99de57424698c4f','2026-02-26 23:57:38',0,'2026-02-27 04:57:38'),(6,5,'36a30f57381f410e6c6d7e3600c517091a69cebb524efa0ab9c1ff8ec60c23d6','2026-02-26 23:57:40',0,'2026-02-27 04:57:39'),(7,6,'71ca98cf269d684b777c9711874748766924fab8741b95e22c177c76cd0fa5f3','2026-02-27 00:08:23',0,'2026-02-27 05:08:23'),(8,6,'1bd8ecbffb3de5f490303c573946fc80e7d7f54756a6123eb574b5ef66aa612f','2026-02-27 00:09:00',0,'2026-02-27 05:08:59'),(9,6,'63d0d5be622964c66fee98f6f0436aa6cafa4f363c4652df9d44129fe9932edf','2026-02-27 00:09:01',0,'2026-02-27 05:09:00'),(10,6,'185f7b42a14f286d75fe8764d6c056a17756cd5f239c3c7fafd2e35e39dd9939','2026-02-27 00:09:11',0,'2026-02-27 05:09:11'),(11,6,'11a2210771fd6a1f1014939010f8db08abd41d661904b525e502dd61b4a39239','2026-02-27 00:13:24',0,'2026-02-27 05:13:24'),(12,6,'8aa8bc917c57fc7192fcc979ca60db147d08ce32902fe0e1d2cb31a200626e63','2026-02-27 00:13:42',0,'2026-02-27 05:13:41'),(13,6,'9266300cf64d6b7673cc77d841a03e5e84f368d7d5700b8d27a6464776faf54c','2026-02-27 00:16:17',0,'2026-02-27 05:16:17'),(14,6,'e346ba99c9ef645c303914360bd4ddc2801ee3565881c446ce6549153ed9057c','2026-02-27 00:16:32',0,'2026-02-27 05:16:32'),(15,6,'8f7b4ecf3d65dcfc9bfdc4ebbab6e51982e9b088e771a760f711af4a310a1340','2026-02-27 00:19:59',0,'2026-02-27 05:19:58'),(16,6,'4507b5453bc14bbe761ebe5274ad0d45fe5301e29dd30d8d988eb48fc44322d3','2026-02-27 00:21:13',0,'2026-02-27 05:21:13'),(17,6,'918beded6e07cdf314e22b12af0bbee25000afb047a08a1b9c5fde6c3cf53257','2026-02-27 00:27:44',0,'2026-02-27 05:27:44'),(18,6,'e64b0102afb1e35805eee5ae794810b93cf7f8f81061f55e8c26b5d3cb4af5e1','2026-02-27 00:31:04',0,'2026-02-27 05:31:04'),(19,6,'2ac588cfe295b215d9d0f9d77dea2369b5b07f4c6c0a3a5e85ee7b761a2abc2a','2026-02-27 00:32:36',0,'2026-02-27 05:32:35'),(20,6,'e901bb6c6653671cac7897e10c983dc4030daa1cac38c0ea051b8b68ec63f83c','2026-02-27 00:35:38',0,'2026-02-27 05:35:38'),(21,6,'f3ab74d9b1f0285dc79685e449749bdaaea955571c798c7faaf21f74af2a73a1','2026-02-27 00:43:28',0,'2026-02-27 05:43:27'),(22,6,'da1f6402dd98d0b86c6d6182927bc1d2f0dd7c31f9e42582081bb0b783516cdc','2026-02-27 03:33:35',1,'2026-02-27 08:33:34'),(23,6,'474222b646538d23d7f4800928445928728735cc0e0a2c783f4de067087deacd','2026-02-27 03:38:24',1,'2026-02-27 08:38:23'),(24,6,'7c96173c94fca963b51f853fd38387dc9b20a9b0eab591a47a95516110bf4cde','2026-02-27 17:06:30',1,'2026-02-27 22:06:29');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_history`
--

DROP TABLE IF EXISTS `stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `disco_id` int NOT NULL,
  `orden_id` int DEFAULT NULL,
  `cambio` int NOT NULL,
  `stock_anterior` int NOT NULL,
  `stock_nuevo` int NOT NULL,
  `motivo` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_disco` (`disco_id`),
  KEY `idx_orden` (`orden_id`),
  CONSTRAINT `stock_history_ibfk_1` FOREIGN KEY (`disco_id`) REFERENCES `discos` (`id`),
  CONSTRAINT `stock_history_ibfk_2` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_history`
--

LOCK TABLES `stock_history` WRITE;
/*!40000 ALTER TABLE `stock_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin','admin@retrosound.com','admin123','admin','2026-02-25 22:17:37'),(2,'coleccionista','user@retrosound.com','user123','user','2026-02-25 22:17:37'),(3,'Usuario1','Usuario1@correo.com','123456789','user','2026-02-25 23:02:52'),(4,'usuario2','usuario2@correo.mx','789456123','user','2026-02-26 23:04:32'),(5,'PatowiiX','patogamecubeawesome@gmail.com','Mazdaspeed3','user','2026-02-27 04:54:59'),(6,'PatowiiX2','psgamerfanclub@gmail.com','IkerOzunaGoku','user','2026-02-27 05:07:53');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-27 20:52:53
