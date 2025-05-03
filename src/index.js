const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
const USB = require('escpos-usb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize printer
let printer = null;
let printerConnected = false;

// Find and connect to printer
function connectToPrinter() {
    try {
        const device = new USB();
        printer = new escpos.Printer(device);

        device.open((error) => {
            if (error) {
                console.error('Failed to open printer:', error);
                printerConnected = false;
                return;
            }
            printerConnected = true;
            console.log('Printer connected successfully');
        });
    } catch (error) {
        // console.error('Failed to connect to printer:', error);
        printerConnected = false;
    }
}

// Connect to printer on startup
connectToPrinter();

// Print receipt endpoint
app.post('/print-receipt', async (req, res) => {
    try {
        if (!printerConnected) {
            connectToPrinter();
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const device = new USB();
        const currentPrinter = new escpos.Printer(device);

        device.open((error) => {
            if (error) {
                console.error('Failed to open printer:', error);
                printerConnected = false;
                return res.status(500).json({
                    error: 'Printer not connected. Please check printer connection and try again.',
                });
            }

            printerConnected = true;
            const { bill, items } = req.body;

            currentPrinter
                .align('CT')
                .style('B')
                .size(0, 0)
                .text('K M TEX SULTHAN BATHERY')
                .size(0.5, 0.5)
                .text('Ph: 9656728836 , 9843256637') // ✅ Added phone number
                .text('Bill Receipt')
                .style('NORMAL')
                .align('CT')
                .text('------------------------------------------------');

            const invoiceNo = `Invoice No: ${bill.id.slice(0, 8)}`;
            const dateStr = `Date: ${new Date(bill.date).toLocaleDateString(
                'en-IN',
            )}`;
            const spacingLength = 48 - (invoiceNo.length + dateStr.length);
            const spacing = ' '.repeat(Math.max(spacingLength, 2));
            currentPrinter.text(`${invoiceNo}${spacing}${dateStr}`);

            currentPrinter
                .text(`Customer: ${bill.customer_name || 'Anonymous'}`)
                .text('------------------------------------------------')
                .text('Item Name           Qty     Price     Total')
                .text('------------------------------------------------');

            items.forEach((item) => {
                const name = item.product.name.slice(0, 20).padEnd(20);
                const qty = item.quantity.toString().padStart(5);
                const price = item.price.toFixed(2).padStart(10);
                const total = (item.price * item.quantity)
                    .toFixed(2)
                    .padStart(13);
                currentPrinter.text(`${name}${qty}${price}${total}`);
            });

            const totalLabel = 'Total Amount:';
            const totalValue = `Rs. ${bill.amount.toFixed(2)}`;
            const spaceBetween = 48 - (totalLabel.length + totalValue.length);
            const spacingTotal = ' '.repeat(Math.max(2, spaceBetween));

            currentPrinter
                .text('------------------------------------------------')
                .style('B')
                .size(1, 1) // ✅ Bigger and bolder total
                .align('LT')
                .text(`${totalLabel}${spacingTotal}${totalValue}`)
                .style('NORMAL')
                .size(0.5, 0.5) // Reset size
                .text(`Payment Status: ${bill.payment_status}`)
                .text(
                    bill.payment_method
                        ? `Payment Method: ${bill.payment_method}`
                        : '',
                )
                .text('------------------------------------------------')
                .align('CT')
                .text('Thank you for your purchase!')
                .text('Please visit again')
                .cut()
                .close((err) => {
                    if (err) {
                        console.error('Printing failed:', err);
                        return res
                            .status(500)
                            .json({ error: 'Printing failed' });
                    }
                    console.log('Receipt printed successfully');
                    res.json({ message: 'Receipt printed successfully' });
                });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        if (!printerConnected) {
            connectToPrinter();
            // Wait for a short time to allow connection
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Test printer connection by creating a new instance
        const device = new USB();
        const testPrinter = new escpos.Printer(device);

        device.open((error) => {
            if (error) {
                printerConnected = false;
                res.json({
                    status: 'warning',
                    printerConnected: false,
                    message:
                        'Printer is not connected. Please check the connection.',
                });
                return;
            }

            printerConnected = true;
            device.close();
            res.json({
                status: 'ok',
                printerConnected: true,
                message: 'Printer is connected and ready',
            });
        });
    } catch (error) {
        printerConnected = false;
        res.json({
            status: 'error',
            printerConnected: false,
            message: 'Error checking printer status',
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
