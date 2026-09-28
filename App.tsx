import { StatusBar } from 'expo-status-bar';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {Button, FlatList, StyleSheet, Text, TextInput, View} from 'react-native';

type ShoppingItem = {
  id: number;
  product: string;
  amount: string;
};

const db = SQLite.openDatabaseSync('shopping-list.db');

export default function App() {
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS shopping_items (
          id INTEGER PRIMARY KEY NOT NULL,
          product TEXT,
          amount TEXT
        );
      `);

      await handleFetch();
    } catch (error) {
      console.error('Could not open database', error);
    }
  }

  async function handleFetch() {
    try {
      const list = await db.getAllAsync<ShoppingItem>(
        'SELECT * FROM shopping_items ORDER BY id DESC'
      );

      setShoppingList(list);
    } catch (error) {
      console.error('Could not get items', error);
    }
  }

  async function handleSave() {
    const trimmedProduct = product.trim();
    const trimmedAmount = amount.trim();

    if (!trimmedProduct || !trimmedAmount) {
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO shopping_items (product, amount) VALUES (?, ?)',
        trimmedProduct,
        trimmedAmount
      );

      setProduct('');
      setAmount('');
      await handleFetch();
    } catch (error) {
      console.error('Could not add item', error);
    }
  }

  async function handleDelete(id: number) {
    try {
      await db.runAsync('DELETE FROM shopping_items WHERE id = ?', id);
      await handleFetch();
    } catch (error) {
      console.error('Could not delete item', error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ostoslista</Text>

      <TextInput
        style={styles.input}
        value={product}
        onChangeText={setProduct}
        placeholder="Kirjoita ostos"
      />

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="Määrä"
      />

      <View style={styles.buttons}>
        <Button title="Add" onPress={handleSave} />
      </View>

      <FlatList
        style={styles.list}
        data={shoppingList}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemText}>
              {item.product} ({item.amount})
            </Text>

            <Text style={styles.boughtLink} onPress={() => handleDelete(item.id)}>
              Ostettu
            </Text>
          </View>
        )}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.emptyText}>Lista on tyhjä.</Text>}
      />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 18,
  },
  buttons: {
    marginBottom: 20,
  },
  list: {
    width: '80%',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    fontSize: 18,
  },
  boughtLink: {
    color: '#0066cc',
    fontSize: 16,
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
