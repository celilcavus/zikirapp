import * as SQLite from 'expo-sqlite';

// Veritabanını başlat
export const initDatabase = async (database) => {
  try {
    // Özel zikirler tablosu
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_zikirs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Zikir kayıtları tablosu - mevcut verileri koru
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS zikir_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zikir_id INTEGER NOT NULL,
        zikir_type TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE,
        UNIQUE(zikir_id, zikir_type, date)
      );
    `);
    
    // Zikir hedefleri tablosu - mevcut verileri koru
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS zikir_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zikir_id INTEGER NOT NULL,
        zikir_type TEXT NOT NULL,
        target INTEGER DEFAULT 0,
        UNIQUE(zikir_id, zikir_type)
      );
    `);

    // Ayarlar tablosu
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL
      );
    `);

    // Başarımlar tablosu
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        achievement_key TEXT NOT NULL UNIQUE,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
  }
};

// Veritabanı aç
export const openDatabase = async () => {
  try {
    const database = await SQLite.openDatabaseAsync('zikirsayac.db');
    return database;
  } catch (error) {
    console.error('Veritabanı açma hatası:', error);
    return null;
  }
};

// Ayar kaydet
export const saveSetting = async (database, key, value) => {
  try {
    const existing = await database.getAllAsync(
      'SELECT id FROM settings WHERE key = ?;',
      [key]
    );
    if (existing.length > 0) {
      await database.runAsync(
        'UPDATE settings SET value = ? WHERE key = ?;',
        [value, key]
      );
    } else {
      await database.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?);',
        [key, value]
      );
    }
  } catch (error) {
    console.error('Ayar kaydetme hatası:', error);
  }
};

// Ayar yükle
export const loadSetting = async (database, key, defaultValue = null) => {
  try {
    const result = await database.getAllAsync(
      'SELECT value FROM settings WHERE key = ?;',
      [key]
    );
    if (result.length > 0) {
      return result[0].value;
    }
    return defaultValue;
  } catch (error) {
    console.error('Ayar yükleme hatası:', error);
    return defaultValue;
  }
};

