import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MenuItems.css';

const MenuItems = () => {
    const [items, setItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchItems = async () => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:5000/api/items', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            setItems(response.data);
        } catch (err) {
            setError('Failed to fetch menu items');
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const adminToken = localStorage.getItem('adminToken');
            await axios.delete(`http://localhost:5000/api/items/${id}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            setSuccess('Item deleted successfully');
            fetchItems();
        } catch (err) {
            setError('Failed to delete item');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const adminToken = localStorage.getItem('adminToken');
            await axios.put(`http://localhost:5000/api/items/${editingItem._id}`, editingItem, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            setSuccess('Item updated successfully');
            setEditingItem(null);
            fetchItems();
        } catch (err) {
            setError('Failed to update item');
        }
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="menu-items">
            <div className="menu-items-container">
                <h1 className="menu-items-title">Menu Items</h1>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                {editingItem ? (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <h2 className="edit-form-title">Edit Item</h2>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={editingItem.name}
                                onChange={handleEditChange}
                                required
                                placeholder="Enter item name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="imageUrl">Image URL</label>
                            <input
                                type="url"
                                id="imageUrl"
                                name="imageUrl"
                                value={editingItem.imageUrl}
                                onChange={handleEditChange}
                                required
                                placeholder="Enter image URL"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="price">Price</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={editingItem.price}
                                onChange={handleEditChange}
                                required
                                step="0.01"
                                min="0"
                                placeholder="Enter price"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <input
                                type="text"
                                id="category"
                                name="category"
                                value={editingItem.category}
                                onChange={handleEditChange}
                                required
                                placeholder="Enter category"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="stock">Stock</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={editingItem.stock}
                                onChange={handleEditChange}
                                required
                                min="0"
                                placeholder="Enter stock quantity"
                            />
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isSpecial"
                                    checked={editingItem.isSpecial}
                                    onChange={handleEditChange}
                                />
                                Special Item
                            </label>
                        </div>
                        <div className="button-group">
                            <button type="submit" className="submit-btn">
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="menu-items-grid">
                        {items.map((item) => (
                            <div key={item._id} className="menu-item-card">
                                <div className="menu-item-image">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                    />
                                </div>
                                <div className="menu-item-content">
                                    <h3 className="menu-item-name">{item.name}</h3>
                                    <p className="menu-item-category">{item.category}</p>
                                    <p className="menu-item-price">₹{item.price}</p>
                                    <p className="menu-item-stock">Stock: {item.stock}</p>
                                    {item.isSpecial && (
                                        <span className="special-badge">
                                            Special
                                        </span>
                                    )}
                                    <div className="menu-item-actions">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuItems; 