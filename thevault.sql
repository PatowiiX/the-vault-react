DELIMITER $$
CREATE TRIGGER update_stock_after_order
AFTER INSERT ON ordenes
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_disco_id INT;
    DECLARE v_cantidad INT;
    DECLARE cur CURSOR FOR 
        SELECT JSON_UNQUOTE(JSON_EXTRACT(orden_items, '$[*].disco_id')),
               JSON_UNQUOTE(JSON_EXTRACT(orden_items, '$[*].cantidad'));
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_disco_id, v_cantidad;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE discos SET stock = stock - v_cantidad WHERE id = v_disco_id;
    END LOOP;
    CLOSE cur;
END$$
DELIMITER ;