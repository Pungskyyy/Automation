import fs from 'fs/promises';
import path from 'path';

/**
 * File handler utility untuk menyimpan hasil scraping
 */

export class FileHandler {
  /**
   * Simpan data ke file JSON
   */
  static async saveJSON(data, filename) {
    try {
      const filepath = path.resolve(filename);
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filepath, jsonData, 'utf-8');
      return filepath;
    } catch (error) {
      throw new Error(`Failed to save JSON file: ${error.message}`);
    }
  }

  /**
   * Baca file JSON
   */
  static async readJSON(filename) {
    try {
      const filepath = path.resolve(filename);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  /**
   * Cek apakah file exists
   */
  static async exists(filename) {
    try {
      await fs.access(filename);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate filename dengan timestamp
   */
  static generateFilename(platform, type, extension = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${platform}_${type}_${timestamp}.${extension}`;
  }
}

export default FileHandler;
