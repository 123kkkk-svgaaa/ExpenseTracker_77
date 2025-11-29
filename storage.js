// 数据存储管理类
class StorageManager {
    constructor(prefix = 'expensetracker') {
        this.prefix = prefix;
    }

    // 保存数据
    set(key, data) {
        try {
            const storageKey = `${this.prefix}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`保存数据失败 (${key}):`, e);
            return false;
        }
    }

    // 读取数据
    get(key, defaultValue = null) {
        try {
            const storageKey = `${this.prefix}_${key}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`读取数据失败 (${key}):`, e);
            return defaultValue;
        }
    }

    // 删除数据
    remove(key) {
        try {
            const storageKey = `${this.prefix}_${key}`;
            localStorage.removeItem(storageKey);
            return true;
        } catch (e) {
            console.error(`删除数据失败 (${key}):`, e);
            return false;
        }
    }

    // 清空所有相关数据
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('清空数据失败:', e);
            return false;
        }
    }

    // 获取所有存储的键
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                keys.push(key.replace(`${this.prefix}_`, ''));
            }
        }
        return keys;
    }

    // 检查存储空间
    getStorageInfo() {
        let totalSize = 0;
        const items = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;
                items.push({
                    key: key.replace(`${this.prefix}_`, ''),
                    size: size,
                    value: value
                });
            }
        }

        return {
            totalSize,
            itemCount: items.length,
            items
        };
    }
}

// 创建全局存储管理器实例
const storage = new StorageManager('et77');