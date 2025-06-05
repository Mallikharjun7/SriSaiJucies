import React, { useState } from 'react';
import axios from 'axios';
import './AddMenuItem.css';

const AddMenuItem = () => {
    const [formData, setFormData] = useState({
        name: '',
        imageUrl: '',
        price: '',
        category: '',
        stock: '',
        isSpecial: false
    });
    const [previewImage, setPreviewImage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = [
        { value: 'Juice', label: 'Juice' },
        { value: 'Milkshake', label: 'Milkshake' },
        { value: 'Smoothie', label: 'Smoothie' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'imageUrl') {
            setPreviewImage(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const adminToken = localStorage.getItem('adminToken');
            const response = await axios.post('https://srisaijucies-backend.onrender.com/api/items', formData, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            setSuccess('Menu item added successfully!');
            setFormData({
                name: '',
                imageUrl: '',
                price: '',
                category: '',
                stock: '',
                isSpecial: false
            });
            setPreviewImage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add menu item');
        }
    };

    return (
        <div className="add-menu-item">
            <h2>Add Menu Item</h2>
            
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

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
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
                        value={formData.imageUrl}
                        onChange={handleChange}
                        required
                        placeholder="Enter image URL"
                    />
                    {previewImage && (
                        <div className="image-preview">
                            <img
                                src={previewImage}
                                alt="Preview"
                                onError={() => setPreviewImage('')}
                            />
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="price">Price</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        placeholder="Enter price"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="category-select"
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="stock">Stock</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
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
                            checked={formData.isSpecial}
                            onChange={handleChange}
                        />
                        Special Item
                    </label>
                </div>

                <div className="button-group">
                    <button type="submit" className="submit-btn">
                        Add Menu Item
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => {
                        setFormData({
                            name: '',
                            imageUrl: '',
                            price: '',
                            category: '',
                            stock: '',
                            isSpecial: false
                        });
                        setPreviewImage('');
                    }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMenuItem; 